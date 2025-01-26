(function (factory) {
  const mod = factory();
  if (typeof window !== 'undefined') {
    window['TriggersClass'] = mod;
  }
  if (typeof global !== 'undefined') {
    global['TriggersClass'] = mod;
  }
  if (typeof module !== 'undefined') {
    module.exports = mod;
  }
})(function () {

  class TriggersClass {

    static globMatch(patterns, list) {
      const matches = new Set();

      const regexes = patterns.map(pattern => {
        let regexPattern = pattern
          .replace(/[-/\\^$+?.()|[\]{}]/g, "\\$&") // Escapa caracteres especiales
          .replace(/\\\*/g, ".*")                 // '*' => cualquier cosa
        return new RegExp(`^${regexPattern}$`);
      });
      for (const item of list) {
        for (const regex of regexes) {
          if (regex.test(item)) {
            matches.add(item);
            break;
          }
        }
      }

      return Array.from(matches);
    }


    all = {};

    register(triggerNamePattern, triggerIdentifier, triggerCallback, triggerConfigurations = {}) {
      const { priority = 0 } = triggerConfigurations; // Default priority is 0
      if (!this.all[triggerNamePattern]) {
        this.all[triggerNamePattern] = [];
      }
      this.all[triggerNamePattern].push({
        id: triggerIdentifier,
        callback: triggerCallback,
        priority,
      });
    }

    async emit(triggerName, parameters = {}) {
      const matchedTriggers = [];
      const allPatterns = Object.keys(this.all);

      // Encuentra patrones que coincidan con el nombre del evento
      const matchedPatterns = this.constructor.globMatch(allPatterns, [triggerName]);

      // Agrega todos los eventos coincidentes a la lista de disparos
      for (const pattern of matchedPatterns) {
        matchedTriggers.push(...this.all[pattern]);
      }

      // Ordena por prioridad descendente
      matchedTriggers.sort((a, b) => b.priority - a.priority);

      // Ejecuta los callbacks en orden
      const output = [];
      for (const trigger of matchedTriggers) {
        const result = await trigger.callback(parameters);
        output.push(result);
      }

      return output;
    }

    unregister(triggerIdentifier) {
      for (const pattern in this.all) {
        this.all[pattern] = this.all[pattern].filter(
          (trigger) => trigger.id !== triggerIdentifier
        );
        if (this.all[pattern].length === 0) {
          delete this.all[pattern]; // Limpia patrones vacíos
        }
      }
    }

  }

  TriggersClass.default = TriggersClass;

  return TriggersClass;

});
(function (factory) {
  const mod = factory();
  if (typeof window !== 'undefined') {
    window['Superlogger'] = mod;
  }
  if (typeof global !== 'undefined') {
    global['Superlogger'] = mod;
  }
  if (typeof module !== 'undefined') {
    module.exports = mod;
  }
})(function () {

  const Superlogger = class {

    static create(id, options) {
      return new this(id, options);
    }

    static levels = {
      trace: 4,
      debug: 3,
      log: 2,
      warn: 1,
      error: 0,
    };

    static defaultOptions = {
      active: true,
      level: "trace"
    };

    static loggers = {};

    constructor(id, options = {}) {
      if (typeof id !== "string") {
        throw new Error("Required parameter «id» to be a string on «Superlogger.constructor»");
      }
      if (id in this.constructor.loggers) {
        throw new Error("Required parameter «id» to be a unique string on «Superlogger.constructor»");
      }
      if (typeof options !== "object") {
        throw new Error("Required parameter «object» to be an object on «Superlogger.constructor»");
      }
      this.$id = id;
      this.$options = Object.assign({}, this.constructor.defaultOptions, options);
      this.$source = undefined;
      this.$events = {
        trace: undefined,
        debug: undefined,
        log: undefined,
        warn: undefined,
        error: undefined,
      };
      this.$callbacks = {
        before: undefined,
        after: undefined,
      };
      this.constructor.loggers[id] = this;
    }

    activate() {
      this.$options.active = true;
    }

    deactivate() {
      this.$options.active = false;
    }

    setSource(source) {
      this.source = source;
    }

    setLevel(level) {
      if (!(level in this.constructor.levels)) {
        throw new Error("Required parameter «level» to be a recognized level on «Superlogger.setLevel»");
      }
      this.$options.level = this.constructor.levels[level];
    }

    setEvent(id, callback) {
      this.$events[id] = callback;
    }

    replacerFactory() {
      const visited = new WeakMap();
      return (key, value) => {
        if (typeof value === "function") {
          return "[Function] " + value.toString();
        }
        if (typeof value === "object" && value !== null) {
          if (visited.has(value)) {
            return "[Circular]";
          }
          visited.set(value, true);
        }
        return value;
      }
    }

    stringifyForDebugging(obj) {
      return JSON.stringify(obj, this.replacerFactory(), 2);
    }

    $emit(event, args) {
      if(!(event in this.$events)) {
        return "silently";
      }
      const callback = this.$events[event];
      return callback(this, args);
    }

    $log(levelId, elements, methodId = false) {
      const level = this.constructor.levels[levelId];
      if (!this.$options.active) {
        return "unactive";
      }
      if (this.$options.level < level) {
        return "unleveled";
      }
      let msg = `[${this.$id}][${levelId}]`;
      if (typeof methodId === "string") {
        msg += `[${methodId}]`;
      }
      for (let index = 0; index < elements.length; index++) {
        const element = elements[index];
        const stringification = typeof element === "string" ? element : this.stringifyForDebugging(element);
        msg += " " + stringification;
      }
      this.$emit(level, {elements, methodId});
      console.log(msg);
    }

    trace(methodId, ...data) {
      return this.$log("trace", data, methodId);
    }

    debug(...data) {
      return this.$log("debug", data);
    }

    log(...data) {
      return this.$log("log", data);
    }

    warn(...data) {
      return this.$log("warn", data);
    }

    error(...data) {
      return this.$log("error", data);
    }

  };

  return Superlogger;
});
