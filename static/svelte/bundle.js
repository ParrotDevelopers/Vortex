
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_custom_element_data(node, prop, value) {
        if (prop in node) {
            node[prop] = typeof node[prop] === 'boolean' && value === '' ? true : value;
        }
        else {
            attr(node, prop, value);
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                if (info.blocks[i] === block) {
                                    info.blocks[i] = null;
                                }
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
                if (!info.hasCatch) {
                    throw error;
                }
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }
    function update_await_block_branch(info, ctx, dirty) {
        const child_ctx = ctx.slice();
        const { resolved } = info;
        if (info.current === info.then) {
            child_ctx[info.value] = resolved;
        }
        if (info.current === info.catch) {
            child_ctx[info.error] = resolved;
        }
        info.block.p(child_ctx, dirty);
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.49.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var bind = function bind(fn, thisArg) {
      return function wrap() {
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i];
        }
        return fn.apply(thisArg, args);
      };
    };

    // utils is a library of generic helper functions non-specific to axios

    var toString = Object.prototype.toString;

    // eslint-disable-next-line func-names
    var kindOf = (function(cache) {
      // eslint-disable-next-line func-names
      return function(thing) {
        var str = toString.call(thing);
        return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase());
      };
    })(Object.create(null));

    function kindOfTest(type) {
      type = type.toLowerCase();
      return function isKindOf(thing) {
        return kindOf(thing) === type;
      };
    }

    /**
     * Determine if a value is an Array
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Array, otherwise false
     */
    function isArray(val) {
      return Array.isArray(val);
    }

    /**
     * Determine if a value is undefined
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if the value is undefined, otherwise false
     */
    function isUndefined(val) {
      return typeof val === 'undefined';
    }

    /**
     * Determine if a value is a Buffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Buffer, otherwise false
     */
    function isBuffer(val) {
      return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
        && typeof val.constructor.isBuffer === 'function' && val.constructor.isBuffer(val);
    }

    /**
     * Determine if a value is an ArrayBuffer
     *
     * @function
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an ArrayBuffer, otherwise false
     */
    var isArrayBuffer = kindOfTest('ArrayBuffer');


    /**
     * Determine if a value is a view on an ArrayBuffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
     */
    function isArrayBufferView(val) {
      var result;
      if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
        result = ArrayBuffer.isView(val);
      } else {
        result = (val) && (val.buffer) && (isArrayBuffer(val.buffer));
      }
      return result;
    }

    /**
     * Determine if a value is a String
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a String, otherwise false
     */
    function isString(val) {
      return typeof val === 'string';
    }

    /**
     * Determine if a value is a Number
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Number, otherwise false
     */
    function isNumber(val) {
      return typeof val === 'number';
    }

    /**
     * Determine if a value is an Object
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Object, otherwise false
     */
    function isObject(val) {
      return val !== null && typeof val === 'object';
    }

    /**
     * Determine if a value is a plain Object
     *
     * @param {Object} val The value to test
     * @return {boolean} True if value is a plain Object, otherwise false
     */
    function isPlainObject(val) {
      if (kindOf(val) !== 'object') {
        return false;
      }

      var prototype = Object.getPrototypeOf(val);
      return prototype === null || prototype === Object.prototype;
    }

    /**
     * Determine if a value is a Date
     *
     * @function
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Date, otherwise false
     */
    var isDate = kindOfTest('Date');

    /**
     * Determine if a value is a File
     *
     * @function
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a File, otherwise false
     */
    var isFile = kindOfTest('File');

    /**
     * Determine if a value is a Blob
     *
     * @function
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Blob, otherwise false
     */
    var isBlob = kindOfTest('Blob');

    /**
     * Determine if a value is a FileList
     *
     * @function
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a File, otherwise false
     */
    var isFileList = kindOfTest('FileList');

    /**
     * Determine if a value is a Function
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Function, otherwise false
     */
    function isFunction(val) {
      return toString.call(val) === '[object Function]';
    }

    /**
     * Determine if a value is a Stream
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Stream, otherwise false
     */
    function isStream(val) {
      return isObject(val) && isFunction(val.pipe);
    }

    /**
     * Determine if a value is a FormData
     *
     * @param {Object} thing The value to test
     * @returns {boolean} True if value is an FormData, otherwise false
     */
    function isFormData(thing) {
      var pattern = '[object FormData]';
      return thing && (
        (typeof FormData === 'function' && thing instanceof FormData) ||
        toString.call(thing) === pattern ||
        (isFunction(thing.toString) && thing.toString() === pattern)
      );
    }

    /**
     * Determine if a value is a URLSearchParams object
     * @function
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a URLSearchParams object, otherwise false
     */
    var isURLSearchParams = kindOfTest('URLSearchParams');

    /**
     * Trim excess whitespace off the beginning and end of a string
     *
     * @param {String} str The String to trim
     * @returns {String} The String freed of excess whitespace
     */
    function trim(str) {
      return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
    }

    /**
     * Determine if we're running in a standard browser environment
     *
     * This allows axios to run in a web worker, and react-native.
     * Both environments support XMLHttpRequest, but not fully standard globals.
     *
     * web workers:
     *  typeof window -> undefined
     *  typeof document -> undefined
     *
     * react-native:
     *  navigator.product -> 'ReactNative'
     * nativescript
     *  navigator.product -> 'NativeScript' or 'NS'
     */
    function isStandardBrowserEnv() {
      if (typeof navigator !== 'undefined' && (navigator.product === 'ReactNative' ||
                                               navigator.product === 'NativeScript' ||
                                               navigator.product === 'NS')) {
        return false;
      }
      return (
        typeof window !== 'undefined' &&
        typeof document !== 'undefined'
      );
    }

    /**
     * Iterate over an Array or an Object invoking a function for each item.
     *
     * If `obj` is an Array callback will be called passing
     * the value, index, and complete array for each item.
     *
     * If 'obj' is an Object callback will be called passing
     * the value, key, and complete object for each property.
     *
     * @param {Object|Array} obj The object to iterate
     * @param {Function} fn The callback to invoke for each item
     */
    function forEach(obj, fn) {
      // Don't bother if no value provided
      if (obj === null || typeof obj === 'undefined') {
        return;
      }

      // Force an array if not already something iterable
      if (typeof obj !== 'object') {
        /*eslint no-param-reassign:0*/
        obj = [obj];
      }

      if (isArray(obj)) {
        // Iterate over array values
        for (var i = 0, l = obj.length; i < l; i++) {
          fn.call(null, obj[i], i, obj);
        }
      } else {
        // Iterate over object keys
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            fn.call(null, obj[key], key, obj);
          }
        }
      }
    }

    /**
     * Accepts varargs expecting each argument to be an object, then
     * immutably merges the properties of each object and returns result.
     *
     * When multiple objects contain the same key the later object in
     * the arguments list will take precedence.
     *
     * Example:
     *
     * ```js
     * var result = merge({foo: 123}, {foo: 456});
     * console.log(result.foo); // outputs 456
     * ```
     *
     * @param {Object} obj1 Object to merge
     * @returns {Object} Result of all merge properties
     */
    function merge(/* obj1, obj2, obj3, ... */) {
      var result = {};
      function assignValue(val, key) {
        if (isPlainObject(result[key]) && isPlainObject(val)) {
          result[key] = merge(result[key], val);
        } else if (isPlainObject(val)) {
          result[key] = merge({}, val);
        } else if (isArray(val)) {
          result[key] = val.slice();
        } else {
          result[key] = val;
        }
      }

      for (var i = 0, l = arguments.length; i < l; i++) {
        forEach(arguments[i], assignValue);
      }
      return result;
    }

    /**
     * Extends object a by mutably adding to it the properties of object b.
     *
     * @param {Object} a The object to be extended
     * @param {Object} b The object to copy properties from
     * @param {Object} thisArg The object to bind function to
     * @return {Object} The resulting value of object a
     */
    function extend(a, b, thisArg) {
      forEach(b, function assignValue(val, key) {
        if (thisArg && typeof val === 'function') {
          a[key] = bind(val, thisArg);
        } else {
          a[key] = val;
        }
      });
      return a;
    }

    /**
     * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
     *
     * @param {string} content with BOM
     * @return {string} content value without BOM
     */
    function stripBOM(content) {
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      return content;
    }

    /**
     * Inherit the prototype methods from one constructor into another
     * @param {function} constructor
     * @param {function} superConstructor
     * @param {object} [props]
     * @param {object} [descriptors]
     */

    function inherits(constructor, superConstructor, props, descriptors) {
      constructor.prototype = Object.create(superConstructor.prototype, descriptors);
      constructor.prototype.constructor = constructor;
      props && Object.assign(constructor.prototype, props);
    }

    /**
     * Resolve object with deep prototype chain to a flat object
     * @param {Object} sourceObj source object
     * @param {Object} [destObj]
     * @param {Function} [filter]
     * @returns {Object}
     */

    function toFlatObject(sourceObj, destObj, filter) {
      var props;
      var i;
      var prop;
      var merged = {};

      destObj = destObj || {};

      do {
        props = Object.getOwnPropertyNames(sourceObj);
        i = props.length;
        while (i-- > 0) {
          prop = props[i];
          if (!merged[prop]) {
            destObj[prop] = sourceObj[prop];
            merged[prop] = true;
          }
        }
        sourceObj = Object.getPrototypeOf(sourceObj);
      } while (sourceObj && (!filter || filter(sourceObj, destObj)) && sourceObj !== Object.prototype);

      return destObj;
    }

    /*
     * determines whether a string ends with the characters of a specified string
     * @param {String} str
     * @param {String} searchString
     * @param {Number} [position= 0]
     * @returns {boolean}
     */
    function endsWith(str, searchString, position) {
      str = String(str);
      if (position === undefined || position > str.length) {
        position = str.length;
      }
      position -= searchString.length;
      var lastIndex = str.indexOf(searchString, position);
      return lastIndex !== -1 && lastIndex === position;
    }


    /**
     * Returns new array from array like object
     * @param {*} [thing]
     * @returns {Array}
     */
    function toArray(thing) {
      if (!thing) return null;
      var i = thing.length;
      if (isUndefined(i)) return null;
      var arr = new Array(i);
      while (i-- > 0) {
        arr[i] = thing[i];
      }
      return arr;
    }

    // eslint-disable-next-line func-names
    var isTypedArray = (function(TypedArray) {
      // eslint-disable-next-line func-names
      return function(thing) {
        return TypedArray && thing instanceof TypedArray;
      };
    })(typeof Uint8Array !== 'undefined' && Object.getPrototypeOf(Uint8Array));

    var utils = {
      isArray: isArray,
      isArrayBuffer: isArrayBuffer,
      isBuffer: isBuffer,
      isFormData: isFormData,
      isArrayBufferView: isArrayBufferView,
      isString: isString,
      isNumber: isNumber,
      isObject: isObject,
      isPlainObject: isPlainObject,
      isUndefined: isUndefined,
      isDate: isDate,
      isFile: isFile,
      isBlob: isBlob,
      isFunction: isFunction,
      isStream: isStream,
      isURLSearchParams: isURLSearchParams,
      isStandardBrowserEnv: isStandardBrowserEnv,
      forEach: forEach,
      merge: merge,
      extend: extend,
      trim: trim,
      stripBOM: stripBOM,
      inherits: inherits,
      toFlatObject: toFlatObject,
      kindOf: kindOf,
      kindOfTest: kindOfTest,
      endsWith: endsWith,
      toArray: toArray,
      isTypedArray: isTypedArray,
      isFileList: isFileList
    };

    function encode(val) {
      return encodeURIComponent(val).
        replace(/%3A/gi, ':').
        replace(/%24/g, '$').
        replace(/%2C/gi, ',').
        replace(/%20/g, '+').
        replace(/%5B/gi, '[').
        replace(/%5D/gi, ']');
    }

    /**
     * Build a URL by appending params to the end
     *
     * @param {string} url The base of the url (e.g., http://www.google.com)
     * @param {object} [params] The params to be appended
     * @returns {string} The formatted url
     */
    var buildURL = function buildURL(url, params, paramsSerializer) {
      /*eslint no-param-reassign:0*/
      if (!params) {
        return url;
      }

      var serializedParams;
      if (paramsSerializer) {
        serializedParams = paramsSerializer(params);
      } else if (utils.isURLSearchParams(params)) {
        serializedParams = params.toString();
      } else {
        var parts = [];

        utils.forEach(params, function serialize(val, key) {
          if (val === null || typeof val === 'undefined') {
            return;
          }

          if (utils.isArray(val)) {
            key = key + '[]';
          } else {
            val = [val];
          }

          utils.forEach(val, function parseValue(v) {
            if (utils.isDate(v)) {
              v = v.toISOString();
            } else if (utils.isObject(v)) {
              v = JSON.stringify(v);
            }
            parts.push(encode(key) + '=' + encode(v));
          });
        });

        serializedParams = parts.join('&');
      }

      if (serializedParams) {
        var hashmarkIndex = url.indexOf('#');
        if (hashmarkIndex !== -1) {
          url = url.slice(0, hashmarkIndex);
        }

        url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
      }

      return url;
    };

    function InterceptorManager() {
      this.handlers = [];
    }

    /**
     * Add a new interceptor to the stack
     *
     * @param {Function} fulfilled The function to handle `then` for a `Promise`
     * @param {Function} rejected The function to handle `reject` for a `Promise`
     *
     * @return {Number} An ID used to remove interceptor later
     */
    InterceptorManager.prototype.use = function use(fulfilled, rejected, options) {
      this.handlers.push({
        fulfilled: fulfilled,
        rejected: rejected,
        synchronous: options ? options.synchronous : false,
        runWhen: options ? options.runWhen : null
      });
      return this.handlers.length - 1;
    };

    /**
     * Remove an interceptor from the stack
     *
     * @param {Number} id The ID that was returned by `use`
     */
    InterceptorManager.prototype.eject = function eject(id) {
      if (this.handlers[id]) {
        this.handlers[id] = null;
      }
    };

    /**
     * Iterate over all the registered interceptors
     *
     * This method is particularly useful for skipping over any
     * interceptors that may have become `null` calling `eject`.
     *
     * @param {Function} fn The function to call for each interceptor
     */
    InterceptorManager.prototype.forEach = function forEach(fn) {
      utils.forEach(this.handlers, function forEachHandler(h) {
        if (h !== null) {
          fn(h);
        }
      });
    };

    var InterceptorManager_1 = InterceptorManager;

    var normalizeHeaderName = function normalizeHeaderName(headers, normalizedName) {
      utils.forEach(headers, function processHeader(value, name) {
        if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
          headers[normalizedName] = value;
          delete headers[name];
        }
      });
    };

    /**
     * Create an Error with the specified message, config, error code, request and response.
     *
     * @param {string} message The error message.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [config] The config.
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     * @returns {Error} The created error.
     */
    function AxiosError(message, code, config, request, response) {
      Error.call(this);
      this.message = message;
      this.name = 'AxiosError';
      code && (this.code = code);
      config && (this.config = config);
      request && (this.request = request);
      response && (this.response = response);
    }

    utils.inherits(AxiosError, Error, {
      toJSON: function toJSON() {
        return {
          // Standard
          message: this.message,
          name: this.name,
          // Microsoft
          description: this.description,
          number: this.number,
          // Mozilla
          fileName: this.fileName,
          lineNumber: this.lineNumber,
          columnNumber: this.columnNumber,
          stack: this.stack,
          // Axios
          config: this.config,
          code: this.code,
          status: this.response && this.response.status ? this.response.status : null
        };
      }
    });

    var prototype = AxiosError.prototype;
    var descriptors = {};

    [
      'ERR_BAD_OPTION_VALUE',
      'ERR_BAD_OPTION',
      'ECONNABORTED',
      'ETIMEDOUT',
      'ERR_NETWORK',
      'ERR_FR_TOO_MANY_REDIRECTS',
      'ERR_DEPRECATED',
      'ERR_BAD_RESPONSE',
      'ERR_BAD_REQUEST',
      'ERR_CANCELED'
    // eslint-disable-next-line func-names
    ].forEach(function(code) {
      descriptors[code] = {value: code};
    });

    Object.defineProperties(AxiosError, descriptors);
    Object.defineProperty(prototype, 'isAxiosError', {value: true});

    // eslint-disable-next-line func-names
    AxiosError.from = function(error, code, config, request, response, customProps) {
      var axiosError = Object.create(prototype);

      utils.toFlatObject(error, axiosError, function filter(obj) {
        return obj !== Error.prototype;
      });

      AxiosError.call(axiosError, error.message, code, config, request, response);

      axiosError.name = error.name;

      customProps && Object.assign(axiosError, customProps);

      return axiosError;
    };

    var AxiosError_1 = AxiosError;

    var transitional = {
      silentJSONParsing: true,
      forcedJSONParsing: true,
      clarifyTimeoutError: false
    };

    /**
     * Convert a data object to FormData
     * @param {Object} obj
     * @param {?Object} [formData]
     * @returns {Object}
     **/

    function toFormData(obj, formData) {
      // eslint-disable-next-line no-param-reassign
      formData = formData || new FormData();

      var stack = [];

      function convertValue(value) {
        if (value === null) return '';

        if (utils.isDate(value)) {
          return value.toISOString();
        }

        if (utils.isArrayBuffer(value) || utils.isTypedArray(value)) {
          return typeof Blob === 'function' ? new Blob([value]) : Buffer.from(value);
        }

        return value;
      }

      function build(data, parentKey) {
        if (utils.isPlainObject(data) || utils.isArray(data)) {
          if (stack.indexOf(data) !== -1) {
            throw Error('Circular reference detected in ' + parentKey);
          }

          stack.push(data);

          utils.forEach(data, function each(value, key) {
            if (utils.isUndefined(value)) return;
            var fullKey = parentKey ? parentKey + '.' + key : key;
            var arr;

            if (value && !parentKey && typeof value === 'object') {
              if (utils.endsWith(key, '{}')) {
                // eslint-disable-next-line no-param-reassign
                value = JSON.stringify(value);
              } else if (utils.endsWith(key, '[]') && (arr = utils.toArray(value))) {
                // eslint-disable-next-line func-names
                arr.forEach(function(el) {
                  !utils.isUndefined(el) && formData.append(fullKey, convertValue(el));
                });
                return;
              }
            }

            build(value, fullKey);
          });

          stack.pop();
        } else {
          formData.append(parentKey, convertValue(data));
        }
      }

      build(obj);

      return formData;
    }

    var toFormData_1 = toFormData;

    /**
     * Resolve or reject a Promise based on response status.
     *
     * @param {Function} resolve A function that resolves the promise.
     * @param {Function} reject A function that rejects the promise.
     * @param {object} response The response.
     */
    var settle = function settle(resolve, reject, response) {
      var validateStatus = response.config.validateStatus;
      if (!response.status || !validateStatus || validateStatus(response.status)) {
        resolve(response);
      } else {
        reject(new AxiosError_1(
          'Request failed with status code ' + response.status,
          [AxiosError_1.ERR_BAD_REQUEST, AxiosError_1.ERR_BAD_RESPONSE][Math.floor(response.status / 100) - 4],
          response.config,
          response.request,
          response
        ));
      }
    };

    var cookies = (
      utils.isStandardBrowserEnv() ?

      // Standard browser envs support document.cookie
        (function standardBrowserEnv() {
          return {
            write: function write(name, value, expires, path, domain, secure) {
              var cookie = [];
              cookie.push(name + '=' + encodeURIComponent(value));

              if (utils.isNumber(expires)) {
                cookie.push('expires=' + new Date(expires).toGMTString());
              }

              if (utils.isString(path)) {
                cookie.push('path=' + path);
              }

              if (utils.isString(domain)) {
                cookie.push('domain=' + domain);
              }

              if (secure === true) {
                cookie.push('secure');
              }

              document.cookie = cookie.join('; ');
            },

            read: function read(name) {
              var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
              return (match ? decodeURIComponent(match[3]) : null);
            },

            remove: function remove(name) {
              this.write(name, '', Date.now() - 86400000);
            }
          };
        })() :

      // Non standard browser env (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return {
            write: function write() {},
            read: function read() { return null; },
            remove: function remove() {}
          };
        })()
    );

    /**
     * Determines whether the specified URL is absolute
     *
     * @param {string} url The URL to test
     * @returns {boolean} True if the specified URL is absolute, otherwise false
     */
    var isAbsoluteURL = function isAbsoluteURL(url) {
      // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
      // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
      // by any combination of letters, digits, plus, period, or hyphen.
      return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
    };

    /**
     * Creates a new URL by combining the specified URLs
     *
     * @param {string} baseURL The base URL
     * @param {string} relativeURL The relative URL
     * @returns {string} The combined URL
     */
    var combineURLs = function combineURLs(baseURL, relativeURL) {
      return relativeURL
        ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
        : baseURL;
    };

    /**
     * Creates a new URL by combining the baseURL with the requestedURL,
     * only when the requestedURL is not already an absolute URL.
     * If the requestURL is absolute, this function returns the requestedURL untouched.
     *
     * @param {string} baseURL The base URL
     * @param {string} requestedURL Absolute or relative URL to combine
     * @returns {string} The combined full path
     */
    var buildFullPath = function buildFullPath(baseURL, requestedURL) {
      if (baseURL && !isAbsoluteURL(requestedURL)) {
        return combineURLs(baseURL, requestedURL);
      }
      return requestedURL;
    };

    // Headers whose duplicates are ignored by node
    // c.f. https://nodejs.org/api/http.html#http_message_headers
    var ignoreDuplicateOf = [
      'age', 'authorization', 'content-length', 'content-type', 'etag',
      'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
      'last-modified', 'location', 'max-forwards', 'proxy-authorization',
      'referer', 'retry-after', 'user-agent'
    ];

    /**
     * Parse headers into an object
     *
     * ```
     * Date: Wed, 27 Aug 2014 08:58:49 GMT
     * Content-Type: application/json
     * Connection: keep-alive
     * Transfer-Encoding: chunked
     * ```
     *
     * @param {String} headers Headers needing to be parsed
     * @returns {Object} Headers parsed into an object
     */
    var parseHeaders = function parseHeaders(headers) {
      var parsed = {};
      var key;
      var val;
      var i;

      if (!headers) { return parsed; }

      utils.forEach(headers.split('\n'), function parser(line) {
        i = line.indexOf(':');
        key = utils.trim(line.substr(0, i)).toLowerCase();
        val = utils.trim(line.substr(i + 1));

        if (key) {
          if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
            return;
          }
          if (key === 'set-cookie') {
            parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
          } else {
            parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
          }
        }
      });

      return parsed;
    };

    var isURLSameOrigin = (
      utils.isStandardBrowserEnv() ?

      // Standard browser envs have full support of the APIs needed to test
      // whether the request URL is of the same origin as current location.
        (function standardBrowserEnv() {
          var msie = /(msie|trident)/i.test(navigator.userAgent);
          var urlParsingNode = document.createElement('a');
          var originURL;

          /**
        * Parse a URL to discover it's components
        *
        * @param {String} url The URL to be parsed
        * @returns {Object}
        */
          function resolveURL(url) {
            var href = url;

            if (msie) {
            // IE needs attribute set twice to normalize properties
              urlParsingNode.setAttribute('href', href);
              href = urlParsingNode.href;
            }

            urlParsingNode.setAttribute('href', href);

            // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
            return {
              href: urlParsingNode.href,
              protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
              host: urlParsingNode.host,
              search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
              hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
              hostname: urlParsingNode.hostname,
              port: urlParsingNode.port,
              pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
                urlParsingNode.pathname :
                '/' + urlParsingNode.pathname
            };
          }

          originURL = resolveURL(window.location.href);

          /**
        * Determine if a URL shares the same origin as the current location
        *
        * @param {String} requestURL The URL to test
        * @returns {boolean} True if URL shares the same origin, otherwise false
        */
          return function isURLSameOrigin(requestURL) {
            var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
            return (parsed.protocol === originURL.protocol &&
                parsed.host === originURL.host);
          };
        })() :

      // Non standard browser envs (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return function isURLSameOrigin() {
            return true;
          };
        })()
    );

    /**
     * A `CanceledError` is an object that is thrown when an operation is canceled.
     *
     * @class
     * @param {string=} message The message.
     */
    function CanceledError(message) {
      // eslint-disable-next-line no-eq-null,eqeqeq
      AxiosError_1.call(this, message == null ? 'canceled' : message, AxiosError_1.ERR_CANCELED);
      this.name = 'CanceledError';
    }

    utils.inherits(CanceledError, AxiosError_1, {
      __CANCEL__: true
    });

    var CanceledError_1 = CanceledError;

    var parseProtocol = function parseProtocol(url) {
      var match = /^([-+\w]{1,25})(:?\/\/|:)/.exec(url);
      return match && match[1] || '';
    };

    var xhr = function xhrAdapter(config) {
      return new Promise(function dispatchXhrRequest(resolve, reject) {
        var requestData = config.data;
        var requestHeaders = config.headers;
        var responseType = config.responseType;
        var onCanceled;
        function done() {
          if (config.cancelToken) {
            config.cancelToken.unsubscribe(onCanceled);
          }

          if (config.signal) {
            config.signal.removeEventListener('abort', onCanceled);
          }
        }

        if (utils.isFormData(requestData) && utils.isStandardBrowserEnv()) {
          delete requestHeaders['Content-Type']; // Let the browser set it
        }

        var request = new XMLHttpRequest();

        // HTTP basic authentication
        if (config.auth) {
          var username = config.auth.username || '';
          var password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
          requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
        }

        var fullPath = buildFullPath(config.baseURL, config.url);

        request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

        // Set the request timeout in MS
        request.timeout = config.timeout;

        function onloadend() {
          if (!request) {
            return;
          }
          // Prepare the response
          var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
          var responseData = !responseType || responseType === 'text' ||  responseType === 'json' ?
            request.responseText : request.response;
          var response = {
            data: responseData,
            status: request.status,
            statusText: request.statusText,
            headers: responseHeaders,
            config: config,
            request: request
          };

          settle(function _resolve(value) {
            resolve(value);
            done();
          }, function _reject(err) {
            reject(err);
            done();
          }, response);

          // Clean up request
          request = null;
        }

        if ('onloadend' in request) {
          // Use onloadend if available
          request.onloadend = onloadend;
        } else {
          // Listen for ready state to emulate onloadend
          request.onreadystatechange = function handleLoad() {
            if (!request || request.readyState !== 4) {
              return;
            }

            // The request errored out and we didn't get a response, this will be
            // handled by onerror instead
            // With one exception: request that using file: protocol, most browsers
            // will return status as 0 even though it's a successful request
            if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
              return;
            }
            // readystate handler is calling before onerror or ontimeout handlers,
            // so we should call onloadend on the next 'tick'
            setTimeout(onloadend);
          };
        }

        // Handle browser request cancellation (as opposed to a manual cancellation)
        request.onabort = function handleAbort() {
          if (!request) {
            return;
          }

          reject(new AxiosError_1('Request aborted', AxiosError_1.ECONNABORTED, config, request));

          // Clean up request
          request = null;
        };

        // Handle low level network errors
        request.onerror = function handleError() {
          // Real errors are hidden from us by the browser
          // onerror should only fire if it's a network error
          reject(new AxiosError_1('Network Error', AxiosError_1.ERR_NETWORK, config, request, request));

          // Clean up request
          request = null;
        };

        // Handle timeout
        request.ontimeout = function handleTimeout() {
          var timeoutErrorMessage = config.timeout ? 'timeout of ' + config.timeout + 'ms exceeded' : 'timeout exceeded';
          var transitional$1 = config.transitional || transitional;
          if (config.timeoutErrorMessage) {
            timeoutErrorMessage = config.timeoutErrorMessage;
          }
          reject(new AxiosError_1(
            timeoutErrorMessage,
            transitional$1.clarifyTimeoutError ? AxiosError_1.ETIMEDOUT : AxiosError_1.ECONNABORTED,
            config,
            request));

          // Clean up request
          request = null;
        };

        // Add xsrf header
        // This is only done if running in a standard browser environment.
        // Specifically not if we're in a web worker, or react-native.
        if (utils.isStandardBrowserEnv()) {
          // Add xsrf header
          var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
            cookies.read(config.xsrfCookieName) :
            undefined;

          if (xsrfValue) {
            requestHeaders[config.xsrfHeaderName] = xsrfValue;
          }
        }

        // Add headers to the request
        if ('setRequestHeader' in request) {
          utils.forEach(requestHeaders, function setRequestHeader(val, key) {
            if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
              // Remove Content-Type if data is undefined
              delete requestHeaders[key];
            } else {
              // Otherwise add header to the request
              request.setRequestHeader(key, val);
            }
          });
        }

        // Add withCredentials to request if needed
        if (!utils.isUndefined(config.withCredentials)) {
          request.withCredentials = !!config.withCredentials;
        }

        // Add responseType to request if needed
        if (responseType && responseType !== 'json') {
          request.responseType = config.responseType;
        }

        // Handle progress if needed
        if (typeof config.onDownloadProgress === 'function') {
          request.addEventListener('progress', config.onDownloadProgress);
        }

        // Not all browsers support upload events
        if (typeof config.onUploadProgress === 'function' && request.upload) {
          request.upload.addEventListener('progress', config.onUploadProgress);
        }

        if (config.cancelToken || config.signal) {
          // Handle cancellation
          // eslint-disable-next-line func-names
          onCanceled = function(cancel) {
            if (!request) {
              return;
            }
            reject(!cancel || (cancel && cancel.type) ? new CanceledError_1() : cancel);
            request.abort();
            request = null;
          };

          config.cancelToken && config.cancelToken.subscribe(onCanceled);
          if (config.signal) {
            config.signal.aborted ? onCanceled() : config.signal.addEventListener('abort', onCanceled);
          }
        }

        if (!requestData) {
          requestData = null;
        }

        var protocol = parseProtocol(fullPath);

        if (protocol && [ 'http', 'https', 'file' ].indexOf(protocol) === -1) {
          reject(new AxiosError_1('Unsupported protocol ' + protocol + ':', AxiosError_1.ERR_BAD_REQUEST, config));
          return;
        }


        // Send the request
        request.send(requestData);
      });
    };

    // eslint-disable-next-line strict
    var _null = null;

    var DEFAULT_CONTENT_TYPE = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    function setContentTypeIfUnset(headers, value) {
      if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
        headers['Content-Type'] = value;
      }
    }

    function getDefaultAdapter() {
      var adapter;
      if (typeof XMLHttpRequest !== 'undefined') {
        // For browsers use XHR adapter
        adapter = xhr;
      } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
        // For node use HTTP adapter
        adapter = xhr;
      }
      return adapter;
    }

    function stringifySafely(rawValue, parser, encoder) {
      if (utils.isString(rawValue)) {
        try {
          (parser || JSON.parse)(rawValue);
          return utils.trim(rawValue);
        } catch (e) {
          if (e.name !== 'SyntaxError') {
            throw e;
          }
        }
      }

      return (encoder || JSON.stringify)(rawValue);
    }

    var defaults = {

      transitional: transitional,

      adapter: getDefaultAdapter(),

      transformRequest: [function transformRequest(data, headers) {
        normalizeHeaderName(headers, 'Accept');
        normalizeHeaderName(headers, 'Content-Type');

        if (utils.isFormData(data) ||
          utils.isArrayBuffer(data) ||
          utils.isBuffer(data) ||
          utils.isStream(data) ||
          utils.isFile(data) ||
          utils.isBlob(data)
        ) {
          return data;
        }
        if (utils.isArrayBufferView(data)) {
          return data.buffer;
        }
        if (utils.isURLSearchParams(data)) {
          setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
          return data.toString();
        }

        var isObjectPayload = utils.isObject(data);
        var contentType = headers && headers['Content-Type'];

        var isFileList;

        if ((isFileList = utils.isFileList(data)) || (isObjectPayload && contentType === 'multipart/form-data')) {
          var _FormData = this.env && this.env.FormData;
          return toFormData_1(isFileList ? {'files[]': data} : data, _FormData && new _FormData());
        } else if (isObjectPayload || contentType === 'application/json') {
          setContentTypeIfUnset(headers, 'application/json');
          return stringifySafely(data);
        }

        return data;
      }],

      transformResponse: [function transformResponse(data) {
        var transitional = this.transitional || defaults.transitional;
        var silentJSONParsing = transitional && transitional.silentJSONParsing;
        var forcedJSONParsing = transitional && transitional.forcedJSONParsing;
        var strictJSONParsing = !silentJSONParsing && this.responseType === 'json';

        if (strictJSONParsing || (forcedJSONParsing && utils.isString(data) && data.length)) {
          try {
            return JSON.parse(data);
          } catch (e) {
            if (strictJSONParsing) {
              if (e.name === 'SyntaxError') {
                throw AxiosError_1.from(e, AxiosError_1.ERR_BAD_RESPONSE, this, null, this.response);
              }
              throw e;
            }
          }
        }

        return data;
      }],

      /**
       * A timeout in milliseconds to abort a request. If set to 0 (default) a
       * timeout is not created.
       */
      timeout: 0,

      xsrfCookieName: 'XSRF-TOKEN',
      xsrfHeaderName: 'X-XSRF-TOKEN',

      maxContentLength: -1,
      maxBodyLength: -1,

      env: {
        FormData: _null
      },

      validateStatus: function validateStatus(status) {
        return status >= 200 && status < 300;
      },

      headers: {
        common: {
          'Accept': 'application/json, text/plain, */*'
        }
      }
    };

    utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
      defaults.headers[method] = {};
    });

    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
    });

    var defaults_1 = defaults;

    /**
     * Transform the data for a request or a response
     *
     * @param {Object|String} data The data to be transformed
     * @param {Array} headers The headers for the request or response
     * @param {Array|Function} fns A single function or Array of functions
     * @returns {*} The resulting transformed data
     */
    var transformData = function transformData(data, headers, fns) {
      var context = this || defaults_1;
      /*eslint no-param-reassign:0*/
      utils.forEach(fns, function transform(fn) {
        data = fn.call(context, data, headers);
      });

      return data;
    };

    var isCancel = function isCancel(value) {
      return !!(value && value.__CANCEL__);
    };

    /**
     * Throws a `CanceledError` if cancellation has been requested.
     */
    function throwIfCancellationRequested(config) {
      if (config.cancelToken) {
        config.cancelToken.throwIfRequested();
      }

      if (config.signal && config.signal.aborted) {
        throw new CanceledError_1();
      }
    }

    /**
     * Dispatch a request to the server using the configured adapter.
     *
     * @param {object} config The config that is to be used for the request
     * @returns {Promise} The Promise to be fulfilled
     */
    var dispatchRequest = function dispatchRequest(config) {
      throwIfCancellationRequested(config);

      // Ensure headers exist
      config.headers = config.headers || {};

      // Transform request data
      config.data = transformData.call(
        config,
        config.data,
        config.headers,
        config.transformRequest
      );

      // Flatten headers
      config.headers = utils.merge(
        config.headers.common || {},
        config.headers[config.method] || {},
        config.headers
      );

      utils.forEach(
        ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
        function cleanHeaderConfig(method) {
          delete config.headers[method];
        }
      );

      var adapter = config.adapter || defaults_1.adapter;

      return adapter(config).then(function onAdapterResolution(response) {
        throwIfCancellationRequested(config);

        // Transform response data
        response.data = transformData.call(
          config,
          response.data,
          response.headers,
          config.transformResponse
        );

        return response;
      }, function onAdapterRejection(reason) {
        if (!isCancel(reason)) {
          throwIfCancellationRequested(config);

          // Transform response data
          if (reason && reason.response) {
            reason.response.data = transformData.call(
              config,
              reason.response.data,
              reason.response.headers,
              config.transformResponse
            );
          }
        }

        return Promise.reject(reason);
      });
    };

    /**
     * Config-specific merge-function which creates a new config-object
     * by merging two configuration objects together.
     *
     * @param {Object} config1
     * @param {Object} config2
     * @returns {Object} New object resulting from merging config2 to config1
     */
    var mergeConfig = function mergeConfig(config1, config2) {
      // eslint-disable-next-line no-param-reassign
      config2 = config2 || {};
      var config = {};

      function getMergedValue(target, source) {
        if (utils.isPlainObject(target) && utils.isPlainObject(source)) {
          return utils.merge(target, source);
        } else if (utils.isPlainObject(source)) {
          return utils.merge({}, source);
        } else if (utils.isArray(source)) {
          return source.slice();
        }
        return source;
      }

      // eslint-disable-next-line consistent-return
      function mergeDeepProperties(prop) {
        if (!utils.isUndefined(config2[prop])) {
          return getMergedValue(config1[prop], config2[prop]);
        } else if (!utils.isUndefined(config1[prop])) {
          return getMergedValue(undefined, config1[prop]);
        }
      }

      // eslint-disable-next-line consistent-return
      function valueFromConfig2(prop) {
        if (!utils.isUndefined(config2[prop])) {
          return getMergedValue(undefined, config2[prop]);
        }
      }

      // eslint-disable-next-line consistent-return
      function defaultToConfig2(prop) {
        if (!utils.isUndefined(config2[prop])) {
          return getMergedValue(undefined, config2[prop]);
        } else if (!utils.isUndefined(config1[prop])) {
          return getMergedValue(undefined, config1[prop]);
        }
      }

      // eslint-disable-next-line consistent-return
      function mergeDirectKeys(prop) {
        if (prop in config2) {
          return getMergedValue(config1[prop], config2[prop]);
        } else if (prop in config1) {
          return getMergedValue(undefined, config1[prop]);
        }
      }

      var mergeMap = {
        'url': valueFromConfig2,
        'method': valueFromConfig2,
        'data': valueFromConfig2,
        'baseURL': defaultToConfig2,
        'transformRequest': defaultToConfig2,
        'transformResponse': defaultToConfig2,
        'paramsSerializer': defaultToConfig2,
        'timeout': defaultToConfig2,
        'timeoutMessage': defaultToConfig2,
        'withCredentials': defaultToConfig2,
        'adapter': defaultToConfig2,
        'responseType': defaultToConfig2,
        'xsrfCookieName': defaultToConfig2,
        'xsrfHeaderName': defaultToConfig2,
        'onUploadProgress': defaultToConfig2,
        'onDownloadProgress': defaultToConfig2,
        'decompress': defaultToConfig2,
        'maxContentLength': defaultToConfig2,
        'maxBodyLength': defaultToConfig2,
        'beforeRedirect': defaultToConfig2,
        'transport': defaultToConfig2,
        'httpAgent': defaultToConfig2,
        'httpsAgent': defaultToConfig2,
        'cancelToken': defaultToConfig2,
        'socketPath': defaultToConfig2,
        'responseEncoding': defaultToConfig2,
        'validateStatus': mergeDirectKeys
      };

      utils.forEach(Object.keys(config1).concat(Object.keys(config2)), function computeConfigValue(prop) {
        var merge = mergeMap[prop] || mergeDeepProperties;
        var configValue = merge(prop);
        (utils.isUndefined(configValue) && merge !== mergeDirectKeys) || (config[prop] = configValue);
      });

      return config;
    };

    var data = {
      "version": "0.27.2"
    };

    var VERSION = data.version;


    var validators$1 = {};

    // eslint-disable-next-line func-names
    ['object', 'boolean', 'number', 'function', 'string', 'symbol'].forEach(function(type, i) {
      validators$1[type] = function validator(thing) {
        return typeof thing === type || 'a' + (i < 1 ? 'n ' : ' ') + type;
      };
    });

    var deprecatedWarnings = {};

    /**
     * Transitional option validator
     * @param {function|boolean?} validator - set to false if the transitional option has been removed
     * @param {string?} version - deprecated version / removed since version
     * @param {string?} message - some message with additional info
     * @returns {function}
     */
    validators$1.transitional = function transitional(validator, version, message) {
      function formatMessage(opt, desc) {
        return '[Axios v' + VERSION + '] Transitional option \'' + opt + '\'' + desc + (message ? '. ' + message : '');
      }

      // eslint-disable-next-line func-names
      return function(value, opt, opts) {
        if (validator === false) {
          throw new AxiosError_1(
            formatMessage(opt, ' has been removed' + (version ? ' in ' + version : '')),
            AxiosError_1.ERR_DEPRECATED
          );
        }

        if (version && !deprecatedWarnings[opt]) {
          deprecatedWarnings[opt] = true;
          // eslint-disable-next-line no-console
          console.warn(
            formatMessage(
              opt,
              ' has been deprecated since v' + version + ' and will be removed in the near future'
            )
          );
        }

        return validator ? validator(value, opt, opts) : true;
      };
    };

    /**
     * Assert object's properties type
     * @param {object} options
     * @param {object} schema
     * @param {boolean?} allowUnknown
     */

    function assertOptions(options, schema, allowUnknown) {
      if (typeof options !== 'object') {
        throw new AxiosError_1('options must be an object', AxiosError_1.ERR_BAD_OPTION_VALUE);
      }
      var keys = Object.keys(options);
      var i = keys.length;
      while (i-- > 0) {
        var opt = keys[i];
        var validator = schema[opt];
        if (validator) {
          var value = options[opt];
          var result = value === undefined || validator(value, opt, options);
          if (result !== true) {
            throw new AxiosError_1('option ' + opt + ' must be ' + result, AxiosError_1.ERR_BAD_OPTION_VALUE);
          }
          continue;
        }
        if (allowUnknown !== true) {
          throw new AxiosError_1('Unknown option ' + opt, AxiosError_1.ERR_BAD_OPTION);
        }
      }
    }

    var validator = {
      assertOptions: assertOptions,
      validators: validators$1
    };

    var validators = validator.validators;
    /**
     * Create a new instance of Axios
     *
     * @param {Object} instanceConfig The default config for the instance
     */
    function Axios(instanceConfig) {
      this.defaults = instanceConfig;
      this.interceptors = {
        request: new InterceptorManager_1(),
        response: new InterceptorManager_1()
      };
    }

    /**
     * Dispatch a request
     *
     * @param {Object} config The config specific for this request (merged with this.defaults)
     */
    Axios.prototype.request = function request(configOrUrl, config) {
      /*eslint no-param-reassign:0*/
      // Allow for axios('example/url'[, config]) a la fetch API
      if (typeof configOrUrl === 'string') {
        config = config || {};
        config.url = configOrUrl;
      } else {
        config = configOrUrl || {};
      }

      config = mergeConfig(this.defaults, config);

      // Set config.method
      if (config.method) {
        config.method = config.method.toLowerCase();
      } else if (this.defaults.method) {
        config.method = this.defaults.method.toLowerCase();
      } else {
        config.method = 'get';
      }

      var transitional = config.transitional;

      if (transitional !== undefined) {
        validator.assertOptions(transitional, {
          silentJSONParsing: validators.transitional(validators.boolean),
          forcedJSONParsing: validators.transitional(validators.boolean),
          clarifyTimeoutError: validators.transitional(validators.boolean)
        }, false);
      }

      // filter out skipped interceptors
      var requestInterceptorChain = [];
      var synchronousRequestInterceptors = true;
      this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
        if (typeof interceptor.runWhen === 'function' && interceptor.runWhen(config) === false) {
          return;
        }

        synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;

        requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
      });

      var responseInterceptorChain = [];
      this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
        responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
      });

      var promise;

      if (!synchronousRequestInterceptors) {
        var chain = [dispatchRequest, undefined];

        Array.prototype.unshift.apply(chain, requestInterceptorChain);
        chain = chain.concat(responseInterceptorChain);

        promise = Promise.resolve(config);
        while (chain.length) {
          promise = promise.then(chain.shift(), chain.shift());
        }

        return promise;
      }


      var newConfig = config;
      while (requestInterceptorChain.length) {
        var onFulfilled = requestInterceptorChain.shift();
        var onRejected = requestInterceptorChain.shift();
        try {
          newConfig = onFulfilled(newConfig);
        } catch (error) {
          onRejected(error);
          break;
        }
      }

      try {
        promise = dispatchRequest(newConfig);
      } catch (error) {
        return Promise.reject(error);
      }

      while (responseInterceptorChain.length) {
        promise = promise.then(responseInterceptorChain.shift(), responseInterceptorChain.shift());
      }

      return promise;
    };

    Axios.prototype.getUri = function getUri(config) {
      config = mergeConfig(this.defaults, config);
      var fullPath = buildFullPath(config.baseURL, config.url);
      return buildURL(fullPath, config.params, config.paramsSerializer);
    };

    // Provide aliases for supported request methods
    utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, config) {
        return this.request(mergeConfig(config || {}, {
          method: method,
          url: url,
          data: (config || {}).data
        }));
      };
    });

    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      /*eslint func-names:0*/

      function generateHTTPMethod(isForm) {
        return function httpMethod(url, data, config) {
          return this.request(mergeConfig(config || {}, {
            method: method,
            headers: isForm ? {
              'Content-Type': 'multipart/form-data'
            } : {},
            url: url,
            data: data
          }));
        };
      }

      Axios.prototype[method] = generateHTTPMethod();

      Axios.prototype[method + 'Form'] = generateHTTPMethod(true);
    });

    var Axios_1 = Axios;

    /**
     * A `CancelToken` is an object that can be used to request cancellation of an operation.
     *
     * @class
     * @param {Function} executor The executor function.
     */
    function CancelToken(executor) {
      if (typeof executor !== 'function') {
        throw new TypeError('executor must be a function.');
      }

      var resolvePromise;

      this.promise = new Promise(function promiseExecutor(resolve) {
        resolvePromise = resolve;
      });

      var token = this;

      // eslint-disable-next-line func-names
      this.promise.then(function(cancel) {
        if (!token._listeners) return;

        var i;
        var l = token._listeners.length;

        for (i = 0; i < l; i++) {
          token._listeners[i](cancel);
        }
        token._listeners = null;
      });

      // eslint-disable-next-line func-names
      this.promise.then = function(onfulfilled) {
        var _resolve;
        // eslint-disable-next-line func-names
        var promise = new Promise(function(resolve) {
          token.subscribe(resolve);
          _resolve = resolve;
        }).then(onfulfilled);

        promise.cancel = function reject() {
          token.unsubscribe(_resolve);
        };

        return promise;
      };

      executor(function cancel(message) {
        if (token.reason) {
          // Cancellation has already been requested
          return;
        }

        token.reason = new CanceledError_1(message);
        resolvePromise(token.reason);
      });
    }

    /**
     * Throws a `CanceledError` if cancellation has been requested.
     */
    CancelToken.prototype.throwIfRequested = function throwIfRequested() {
      if (this.reason) {
        throw this.reason;
      }
    };

    /**
     * Subscribe to the cancel signal
     */

    CancelToken.prototype.subscribe = function subscribe(listener) {
      if (this.reason) {
        listener(this.reason);
        return;
      }

      if (this._listeners) {
        this._listeners.push(listener);
      } else {
        this._listeners = [listener];
      }
    };

    /**
     * Unsubscribe from the cancel signal
     */

    CancelToken.prototype.unsubscribe = function unsubscribe(listener) {
      if (!this._listeners) {
        return;
      }
      var index = this._listeners.indexOf(listener);
      if (index !== -1) {
        this._listeners.splice(index, 1);
      }
    };

    /**
     * Returns an object that contains a new `CancelToken` and a function that, when called,
     * cancels the `CancelToken`.
     */
    CancelToken.source = function source() {
      var cancel;
      var token = new CancelToken(function executor(c) {
        cancel = c;
      });
      return {
        token: token,
        cancel: cancel
      };
    };

    var CancelToken_1 = CancelToken;

    /**
     * Syntactic sugar for invoking a function and expanding an array for arguments.
     *
     * Common use case would be to use `Function.prototype.apply`.
     *
     *  ```js
     *  function f(x, y, z) {}
     *  var args = [1, 2, 3];
     *  f.apply(null, args);
     *  ```
     *
     * With `spread` this example can be re-written.
     *
     *  ```js
     *  spread(function(x, y, z) {})([1, 2, 3]);
     *  ```
     *
     * @param {Function} callback
     * @returns {Function}
     */
    var spread = function spread(callback) {
      return function wrap(arr) {
        return callback.apply(null, arr);
      };
    };

    /**
     * Determines whether the payload is an error thrown by Axios
     *
     * @param {*} payload The value to test
     * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
     */
    var isAxiosError = function isAxiosError(payload) {
      return utils.isObject(payload) && (payload.isAxiosError === true);
    };

    /**
     * Create an instance of Axios
     *
     * @param {Object} defaultConfig The default config for the instance
     * @return {Axios} A new instance of Axios
     */
    function createInstance(defaultConfig) {
      var context = new Axios_1(defaultConfig);
      var instance = bind(Axios_1.prototype.request, context);

      // Copy axios.prototype to instance
      utils.extend(instance, Axios_1.prototype, context);

      // Copy context to instance
      utils.extend(instance, context);

      // Factory for creating new instances
      instance.create = function create(instanceConfig) {
        return createInstance(mergeConfig(defaultConfig, instanceConfig));
      };

      return instance;
    }

    // Create the default instance to be exported
    var axios$1 = createInstance(defaults_1);

    // Expose Axios class to allow class inheritance
    axios$1.Axios = Axios_1;

    // Expose Cancel & CancelToken
    axios$1.CanceledError = CanceledError_1;
    axios$1.CancelToken = CancelToken_1;
    axios$1.isCancel = isCancel;
    axios$1.VERSION = data.version;
    axios$1.toFormData = toFormData_1;

    // Expose AxiosError class
    axios$1.AxiosError = AxiosError_1;

    // alias for CanceledError for backward compatibility
    axios$1.Cancel = axios$1.CanceledError;

    // Expose all/spread
    axios$1.all = function all(promises) {
      return Promise.all(promises);
    };
    axios$1.spread = spread;

    // Expose isAxiosError
    axios$1.isAxiosError = isAxiosError;

    var axios_1 = axios$1;

    // Allow use of default import syntax in TypeScript
    var _default = axios$1;
    axios_1.default = _default;

    var axios = axios_1;

    /* src\Nav.svelte generated by Svelte v3.49.0 */
    const file$8 = "src\\Nav.svelte";

    // (56:4) {:catch error}
    function create_catch_block$7(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			add_location(p, file$8, 56, 10, 2708);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$7.name,
    		type: "catch",
    		source: "(56:4) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (37:4) {:then resp}
    function create_then_block$7(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*resp*/ ctx[5].data.isAdmin) return create_if_block$7;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$7.name,
    		type: "then",
    		source: "(37:4) {:then resp}",
    		ctx
    	});

    	return block;
    }

    // (48:12) {:else}
    function create_else_block$1(ctx) {
    	let li0;
    	let a0;
    	let t0;
    	let a0_class_value;
    	let t1;
    	let li1;
    	let a1;

    	const block = {
    		c: function create() {
    			li0 = element("li");
    			a0 = element("a");
    			t0 = text("Settings");
    			t1 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "Logout";
    			attr_dev(a0, "class", a0_class_value = "nav-link " + (/*active*/ ctx[0] === 'settings' ? 'active' : '') + " svelte-ayro39");
    			set_style(a0, "margin-left", "65vw");
    			attr_dev(a0, "href", "/?tab=settings");
    			add_location(a0, file$8, 49, 14, 2402);
    			attr_dev(li0, "class", "nav-item");
    			add_location(li0, file$8, 48, 12, 2365);
    			attr_dev(a1, "class", "nav-link svelte-ayro39");
    			attr_dev(a1, "href", "/logout");
    			add_location(a1, file$8, 52, 14, 2593);
    			attr_dev(li1, "class", "nav-item");
    			add_location(li1, file$8, 51, 12, 2556);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li0, anchor);
    			append_dev(li0, a0);
    			append_dev(a0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, li1, anchor);
    			append_dev(li1, a1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*active*/ 1 && a0_class_value !== (a0_class_value = "nav-link " + (/*active*/ ctx[0] === 'settings' ? 'active' : '') + " svelte-ayro39")) {
    				attr_dev(a0, "class", a0_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(li1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(48:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (38:6) {#if resp.data.isAdmin}
    function create_if_block$7(ctx) {
    	let li0;
    	let a0;
    	let t1;
    	let li1;
    	let a1;
    	let t3;
    	let li2;
    	let a2;

    	const block = {
    		c: function create() {
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "Settings";
    			t1 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "Admin CP";
    			t3 = space();
    			li2 = element("li");
    			a2 = element("a");
    			a2.textContent = "Logout";
    			attr_dev(a0, "class", "nav-link svelte-ayro39");
    			set_style(a0, "margin-left", "61vw");
    			attr_dev(a0, "href", "/?tab=settings");
    			add_location(a0, file$8, 39, 14, 1999);
    			attr_dev(li0, "class", "nav-item");
    			add_location(li0, file$8, 38, 12, 1962);
    			attr_dev(a1, "class", "nav-link svelte-ayro39");
    			attr_dev(a1, "href", "/admin");
    			add_location(a1, file$8, 42, 14, 2150);
    			attr_dev(li1, "class", "nav-item");
    			add_location(li1, file$8, 41, 12, 2113);
    			attr_dev(a2, "class", "nav-link svelte-ayro39");
    			attr_dev(a2, "href", "/logout");
    			add_location(a2, file$8, 45, 14, 2266);
    			attr_dev(li2, "class", "nav-item");
    			add_location(li2, file$8, 44, 12, 2229);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li0, anchor);
    			append_dev(li0, a0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, li1, anchor);
    			append_dev(li1, a1);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, li2, anchor);
    			append_dev(li2, a2);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(li1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(li2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(38:6) {#if resp.data.isAdmin}",
    		ctx
    	});

    	return block;
    }

    // (35:124)         <p></p>      {:then resp}
    function create_pending_block$7(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			add_location(p, file$8, 35, 6, 1892);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$7.name,
    		type: "pending",
    		source: "(35:124)         <p></p>      {:then resp}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let nav_1;
    	let a0;
    	let t1;
    	let button;
    	let span;
    	let t2;
    	let div;
    	let ul;
    	let li0;
    	let a1;
    	let t3;
    	let a1_class_value;
    	let t4;
    	let li1;
    	let a2;
    	let t5;
    	let a2_class_value;
    	let t6;
    	let li2;
    	let a3;
    	let t7;
    	let a3_class_value;
    	let t8;
    	let li3;
    	let a4;
    	let t9;
    	let a4_class_value;
    	let t10;
    	let li4;
    	let a5;
    	let t11;
    	let a5_class_value;
    	let t12;
    	let nav_1_class_value;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block$7,
    		then: create_then_block$7,
    		catch: create_catch_block$7,
    		value: 5,
    		error: 6
    	};

    	handle_promise(
    		axios.get("/api/userInfo", {
    			transformResponse: /*func*/ ctx[3],
    			responseType: 'json'
    		}),
    		info
    	);

    	const block = {
    		c: function create() {
    			nav_1 = element("nav");
    			a0 = element("a");
    			a0.textContent = "Vortex";
    			t1 = space();
    			button = element("button");
    			span = element("span");
    			t2 = space();
    			div = element("div");
    			ul = element("ul");
    			li0 = element("li");
    			a1 = element("a");
    			t3 = text("Home");
    			t4 = space();
    			li1 = element("li");
    			a2 = element("a");
    			t5 = text("Search");
    			t6 = space();
    			li2 = element("li");
    			a3 = element("a");
    			t7 = text("Favorites");
    			t8 = space();
    			li3 = element("li");
    			a4 = element("a");
    			t9 = text("Playlists");
    			t10 = space();
    			li4 = element("li");
    			a5 = element("a");
    			t11 = text("Addons");
    			t12 = space();
    			info.block.c();
    			attr_dev(a0, "class", "navbar-brand svelte-ayro39");
    			attr_dev(a0, "href", "/");
    			add_location(a0, file$8, 21, 4, 709);
    			attr_dev(span, "class", "navbar-toggler-icon");
    			add_location(span, file$8, 23, 6, 964);
    			attr_dev(button, "class", "navbar-toggler");
    			attr_dev(button, "type", "button");
    			attr_dev(button, "data-toggle", "collapse");
    			attr_dev(button, "data-target", "#navbarSupportedContent");
    			attr_dev(button, "aria-controls", "navbarSupportedContent");
    			attr_dev(button, "aria-expanded", "false");
    			attr_dev(button, "aria-label", "Toggle navigation");
    			add_location(button, file$8, 22, 4, 758);
    			attr_dev(a1, "class", a1_class_value = "nav-link " + (/*active*/ ctx[0] === 'home' ? 'active' : '') + " svelte-ayro39");
    			attr_dev(a1, "href", "/");
    			add_location(a1, file$8, 28, 29, 1164);
    			attr_dev(li0, "class", "nav-item");
    			add_location(li0, file$8, 28, 8, 1143);
    			attr_dev(a2, "class", a2_class_value = "nav-link " + (/*active*/ ctx[0] === 'search' ? 'active' : '') + " svelte-ayro39");
    			attr_dev(a2, "href", "/?tab=search");
    			add_location(a2, file$8, 29, 29, 1273);
    			attr_dev(li1, "class", "nav-item");
    			add_location(li1, file$8, 29, 8, 1252);
    			attr_dev(a3, "class", a3_class_value = "nav-link " + (/*active*/ ctx[0] === 'favorites' ? 'active' : '') + " svelte-ayro39");
    			attr_dev(a3, "href", "/?tab=favorites");
    			add_location(a3, file$8, 30, 29, 1397);
    			attr_dev(li2, "class", "nav-item");
    			add_location(li2, file$8, 30, 8, 1376);
    			attr_dev(a4, "class", a4_class_value = "nav-link " + (/*active*/ ctx[0] === 'playlists' ? 'active' : '') + " svelte-ayro39");
    			attr_dev(a4, "href", "/?tab=playlists");
    			add_location(a4, file$8, 31, 29, 1530);
    			attr_dev(li3, "class", "nav-item");
    			add_location(li3, file$8, 31, 8, 1509);
    			attr_dev(a5, "class", a5_class_value = "nav-link " + (/*active*/ ctx[0] === 'addons' ? 'active' : '') + " svelte-ayro39");
    			attr_dev(a5, "href", "/?tab=addons");
    			add_location(a5, file$8, 32, 29, 1663);
    			attr_dev(li4, "class", "nav-item");
    			add_location(li4, file$8, 32, 8, 1642);
    			attr_dev(ul, "class", "navbar-nav mr-auto");
    			add_location(ul, file$8, 26, 6, 1100);
    			attr_dev(div, "class", "collapse navbar-collapse");
    			attr_dev(div, "id", "navbarSupportedContent");
    			add_location(div, file$8, 25, 4, 1026);

    			attr_dev(nav_1, "class", nav_1_class_value = "navbar navbar-expand-lg fixed-top " + (/*scrollEffect*/ ctx[1] === 'true'
    			? 'transparent'
    			: 'black') + " svelte-ayro39");

    			add_location(nav_1, file$8, 20, 0, 588);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav_1, anchor);
    			append_dev(nav_1, a0);
    			append_dev(nav_1, t1);
    			append_dev(nav_1, button);
    			append_dev(button, span);
    			append_dev(nav_1, t2);
    			append_dev(nav_1, div);
    			append_dev(div, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a1);
    			append_dev(a1, t3);
    			append_dev(ul, t4);
    			append_dev(ul, li1);
    			append_dev(li1, a2);
    			append_dev(a2, t5);
    			append_dev(ul, t6);
    			append_dev(ul, li2);
    			append_dev(li2, a3);
    			append_dev(a3, t7);
    			append_dev(ul, t8);
    			append_dev(ul, li3);
    			append_dev(li3, a4);
    			append_dev(a4, t9);
    			append_dev(ul, t10);
    			append_dev(ul, li4);
    			append_dev(li4, a5);
    			append_dev(a5, t11);
    			append_dev(ul, t12);
    			info.block.m(ul, info.anchor = null);
    			info.mount = () => ul;
    			info.anchor = null;
    			/*nav_1_binding*/ ctx[4](nav_1);
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*active*/ 1 && a1_class_value !== (a1_class_value = "nav-link " + (/*active*/ ctx[0] === 'home' ? 'active' : '') + " svelte-ayro39")) {
    				attr_dev(a1, "class", a1_class_value);
    			}

    			if (dirty & /*active*/ 1 && a2_class_value !== (a2_class_value = "nav-link " + (/*active*/ ctx[0] === 'search' ? 'active' : '') + " svelte-ayro39")) {
    				attr_dev(a2, "class", a2_class_value);
    			}

    			if (dirty & /*active*/ 1 && a3_class_value !== (a3_class_value = "nav-link " + (/*active*/ ctx[0] === 'favorites' ? 'active' : '') + " svelte-ayro39")) {
    				attr_dev(a3, "class", a3_class_value);
    			}

    			if (dirty & /*active*/ 1 && a4_class_value !== (a4_class_value = "nav-link " + (/*active*/ ctx[0] === 'playlists' ? 'active' : '') + " svelte-ayro39")) {
    				attr_dev(a4, "class", a4_class_value);
    			}

    			if (dirty & /*active*/ 1 && a5_class_value !== (a5_class_value = "nav-link " + (/*active*/ ctx[0] === 'addons' ? 'active' : '') + " svelte-ayro39")) {
    				attr_dev(a5, "class", a5_class_value);
    			}

    			update_await_block_branch(info, ctx, dirty);

    			if (dirty & /*scrollEffect*/ 2 && nav_1_class_value !== (nav_1_class_value = "navbar navbar-expand-lg fixed-top " + (/*scrollEffect*/ ctx[1] === 'true'
    			? 'transparent'
    			: 'black') + " svelte-ayro39")) {
    				attr_dev(nav_1, "class", nav_1_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav_1);
    			info.block.d();
    			info.token = null;
    			info = null;
    			/*nav_1_binding*/ ctx[4](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Nav', slots, []);
    	let { active } = $$props;
    	let { scrollEffect = "true" } = $$props;
    	var nav = "";

    	window.addEventListener('scroll', () => {
    		if (scrollEffect == "false") {
    			$$invalidate(2, nav.style.backgroundColor = `black`, nav);
    			return;
    		}

    		let y = 1 + (window.scrollY || window.pageYOffset) / 150;
    		y = y < 1 ? 1 : y; // ensure y is always >= 1 (due to Safari's elastic scroll)

    		//console.log(y); // for debugging
    		if (y < 5.76) {
    			$$invalidate(2, nav.style.backgroundColor = `transparent`, nav);
    		} else {
    			$$invalidate(2, nav.style.backgroundColor = `black`, nav);
    		}
    	});

    	const writable_props = ['active', 'scrollEffect'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Nav> was created with unknown prop '${key}'`);
    	});

    	const func = res => {
    		return JSON.parse(res);
    	};

    	function nav_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			nav = $$value;
    			$$invalidate(2, nav);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('active' in $$props) $$invalidate(0, active = $$props.active);
    		if ('scrollEffect' in $$props) $$invalidate(1, scrollEffect = $$props.scrollEffect);
    	};

    	$$self.$capture_state = () => ({ axios, active, scrollEffect, nav });

    	$$self.$inject_state = $$props => {
    		if ('active' in $$props) $$invalidate(0, active = $$props.active);
    		if ('scrollEffect' in $$props) $$invalidate(1, scrollEffect = $$props.scrollEffect);
    		if ('nav' in $$props) $$invalidate(2, nav = $$props.nav);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [active, scrollEffect, nav, func, nav_1_binding];
    }

    class Nav extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { active: 0, scrollEffect: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Nav",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*active*/ ctx[0] === undefined && !('active' in props)) {
    			console.warn("<Nav> was created without expected prop 'active'");
    		}
    	}

    	get active() {
    		throw new Error("<Nav>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<Nav>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scrollEffect() {
    		throw new Error("<Nav>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scrollEffect(value) {
    		throw new Error("<Nav>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Featured.svelte generated by Svelte v3.49.0 */

    const { Object: Object_1$6, console: console_1$6 } = globals;
    const file$7 = "src\\Featured.svelte";

    function get_each_context$7(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[24] = list[i][0];
    	child_ctx[25] = list[i][1];
    	return child_ctx;
    }

    // (82:12) {#if line}
    function create_if_block_3$1(ctx) {
    	let h2;
    	let t;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			t = text(/*line*/ ctx[3]);
    			attr_dev(h2, "class", "svelte-suxjp4");
    			add_location(h2, file$7, 82, 12, 2812);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			append_dev(h2, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*line*/ 8) set_data_dev(t, /*line*/ ctx[3]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(82:12) {#if line}",
    		ctx
    	});

    	return block;
    }

    // (85:12) {#if info}
    function create_if_block_2$2(ctx) {
    	let h3;
    	let t;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t = text(/*info*/ ctx[4]);
    			attr_dev(h3, "class", "svelte-suxjp4");
    			add_location(h3, file$7, 85, 12, 2886);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*info*/ 16) set_data_dev(t, /*info*/ ctx[4]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(85:12) {#if info}",
    		ctx
    	});

    	return block;
    }

    // (88:12) {#if plot}
    function create_if_block_1$2(ctx) {
    	let h4;
    	let t;

    	const block = {
    		c: function create() {
    			h4 = element("h4");
    			t = text(/*plot*/ ctx[5]);
    			attr_dev(h4, "class", "svelte-suxjp4");
    			add_location(h4, file$7, 88, 12, 2960);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h4, anchor);
    			append_dev(h4, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*plot*/ 32) set_data_dev(t, /*plot*/ ctx[5]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(88:12) {#if plot}",
    		ctx
    	});

    	return block;
    }

    // (92:12) {#if imdbID && kind}
    function create_if_block$6(ctx) {
    	let a0;
    	let t0;
    	let t1;
    	let a1;
    	let t2_value = (/*inFavorites*/ ctx[1] ? "-" : "+") + "";
    	let t2;
    	let t3;
    	let t4;
    	let a2;
    	let t5;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			a0 = element("a");
    			t0 = text("Play");
    			t1 = space();
    			a1 = element("a");
    			t2 = text(t2_value);
    			t3 = text(" Favorites");
    			t4 = space();
    			a2 = element("a");
    			t5 = text("+ Playlist");
    			attr_dev(a0, "data-id", /*imdbID*/ ctx[0]);
    			attr_dev(a0, "id", "playButton");
    			attr_dev(a0, "class", "bgRed svelte-suxjp4");
    			add_location(a0, file$7, 92, 16, 3062);
    			attr_dev(a1, "data-id", /*imdbID*/ ctx[0]);
    			attr_dev(a1, "id", "favs");
    			attr_dev(a1, "class", "svelte-suxjp4");
    			add_location(a1, file$7, 93, 16, 3186);
    			attr_dev(a2, "data-id", /*imdbID*/ ctx[0]);
    			attr_dev(a2, "id", "pl");
    			attr_dev(a2, "class", "svelte-suxjp4");
    			add_location(a2, file$7, 94, 16, 3332);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a0, anchor);
    			append_dev(a0, t0);
    			/*a0_binding*/ ctx[14](a0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, a1, anchor);
    			append_dev(a1, t2);
    			append_dev(a1, t3);
    			/*a1_binding*/ ctx[16](a1);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, a2, anchor);
    			append_dev(a2, t5);
    			/*a2_binding*/ ctx[18](a2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(a0, "click", /*click_handler*/ ctx[15], false, false, false),
    					listen_dev(a1, "click", /*click_handler_1*/ ctx[17], false, false, false),
    					listen_dev(a2, "click", /*click_handler_2*/ ctx[19], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*imdbID*/ 1) {
    				attr_dev(a0, "data-id", /*imdbID*/ ctx[0]);
    			}

    			if (dirty & /*inFavorites*/ 2 && t2_value !== (t2_value = (/*inFavorites*/ ctx[1] ? "-" : "+") + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*imdbID*/ 1) {
    				attr_dev(a1, "data-id", /*imdbID*/ ctx[0]);
    			}

    			if (dirty & /*imdbID*/ 1) {
    				attr_dev(a2, "data-id", /*imdbID*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a0);
    			/*a0_binding*/ ctx[14](null);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(a1);
    			/*a1_binding*/ ctx[16](null);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(a2);
    			/*a2_binding*/ ctx[18](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(92:12) {#if imdbID && kind}",
    		ctx
    	});

    	return block;
    }

    // (109:8) {:catch error}
    function create_catch_block$6(ctx) {
    	let p;
    	let t0;
    	let t1_value = /*error*/ ctx[28].message + "";
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("Error: ");
    			t1 = text(t1_value);
    			set_style(p, "display", "none");
    			add_location(p, file$7, 109, 12, 4025);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$6.name,
    		type: "catch",
    		source: "(109:8) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (105:8) {:then resp}
    function create_then_block$6(ctx) {
    	let each_1_anchor;
    	let each_value = Object.entries(/*resp*/ ctx[23].data);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$7(get_each_context$7(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*Object, axios, JSON, addToPlaylist*/ 2048) {
    				each_value = Object.entries(/*resp*/ ctx[23].data);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$7(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$7(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$6.name,
    		type: "then",
    		source: "(105:8) {:then resp}",
    		ctx
    	});

    	return block;
    }

    // (106:12) {#each Object.entries(resp.data) as [i, d]}
    function create_each_block$7(ctx) {
    	let button;
    	let t_value = /*d*/ ctx[25].title + "";
    	let t;
    	let mounted;
    	let dispose;

    	function click_handler_3() {
    		return /*click_handler_3*/ ctx[21](/*d*/ ctx[25]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			attr_dev(button, "id", /*d*/ ctx[25].playlistID);
    			attr_dev(button, "class", "svelte-suxjp4");
    			add_location(button, file$7, 106, 16, 3869);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_3, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$7.name,
    		type: "each",
    		source: "(106:12) {#each Object.entries(resp.data) as [i, d]}",
    		ctx
    	});

    	return block;
    }

    // (103:133)               <p style="display: none;">Loading ...</p>          {:then resp}
    function create_pending_block$6(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Loading ...";
    			set_style(p, "display", "none");
    			add_location(p, file$7, 103, 12, 3731);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$6.name,
    		type: "pending",
    		source: "(103:133)               <p style=\\\"display: none;\\\">Loading ...</p>          {:then resp}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div2;
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let h1;
    	let raw_value = /*title*/ ctx[2].replace(": ", ": <br />") + "";
    	let h1_class_value;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let div4;
    	let div3;
    	let t6;
    	let button;
    	let mounted;
    	let dispose;
    	let if_block0 = /*line*/ ctx[3] && create_if_block_3$1(ctx);
    	let if_block1 = /*info*/ ctx[4] && create_if_block_2$2(ctx);
    	let if_block2 = /*plot*/ ctx[5] && create_if_block_1$2(ctx);
    	let if_block3 = /*imdbID*/ ctx[0] && /*kind*/ ctx[6] && create_if_block$6(ctx);

    	let info_1 = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block$6,
    		then: create_then_block$6,
    		catch: create_catch_block$6,
    		value: 23,
    		error: 28
    	};

    	handle_promise(
    		axios.get("/api/playlists", {
    			transformResponse: /*func*/ ctx[20],
    			responseType: 'json'
    		}),
    		info_1
    	);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			h1 = element("h1");
    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			if (if_block1) if_block1.c();
    			t3 = space();
    			if (if_block2) if_block2.c();
    			t4 = space();
    			if (if_block3) if_block3.c();
    			t5 = space();
    			div4 = element("div");
    			div3 = element("div");
    			info_1.block.c();
    			t6 = space();
    			button = element("button");
    			button.textContent = "Close";
    			attr_dev(img, "class", "featuredIMG svelte-suxjp4");

    			if (!src_url_equal(img.src, img_src_value = /*imdbID*/ ctx[0]
    			? `/api/banner/${/*imdbID*/ ctx[0]}?do=show`
    			: "")) attr_dev(img, "src", img_src_value);

    			attr_dev(img, "alt", "Featured");
    			add_location(img, file$7, 77, 8, 2500);

    			attr_dev(h1, "class", h1_class_value = "" + (null_to_empty(/*title*/ ctx[2].toLowerCase() == "joker"
    			? "jokerFont"
    			: "normalFont") + " svelte-suxjp4"));

    			add_location(h1, file$7, 79, 12, 2654);
    			attr_dev(div0, "id", "featuredInfo");
    			attr_dev(div0, "class", "info svelte-suxjp4");
    			add_location(div0, file$7, 78, 8, 2604);
    			attr_dev(div1, "id", "featured");
    			attr_dev(div1, "class", "featured svelte-suxjp4");
    			add_location(div1, file$7, 76, 4, 2454);
    			attr_dev(div2, "class", "featuredContainer");
    			add_location(div2, file$7, 75, 0, 2417);
    			attr_dev(button, "class", "svelte-suxjp4");
    			add_location(button, file$7, 111, 8, 4105);
    			attr_dev(div3, "class", "list");
    			add_location(div3, file$7, 101, 4, 3564);
    			attr_dev(div4, "class", "playlistModal svelte-suxjp4");
    			attr_dev(div4, "id", "playlistModal");
    			set_style(div4, "display", "none");
    			add_location(div4, file$7, 100, 0, 3489);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, h1);
    			h1.innerHTML = raw_value;
    			append_dev(div0, t1);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div0, t2);
    			if (if_block1) if_block1.m(div0, null);
    			append_dev(div0, t3);
    			if (if_block2) if_block2.m(div0, null);
    			append_dev(div0, t4);
    			if (if_block3) if_block3.m(div0, null);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			info_1.block.m(div3, info_1.anchor = null);
    			info_1.mount = () => div3;
    			info_1.anchor = t6;
    			append_dev(div3, t6);
    			append_dev(div3, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_4*/ ctx[22], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*imdbID*/ 1 && !src_url_equal(img.src, img_src_value = /*imdbID*/ ctx[0]
    			? `/api/banner/${/*imdbID*/ ctx[0]}?do=show`
    			: "")) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*title*/ 4 && raw_value !== (raw_value = /*title*/ ctx[2].replace(": ", ": <br />") + "")) h1.innerHTML = raw_value;
    			if (dirty & /*title*/ 4 && h1_class_value !== (h1_class_value = "" + (null_to_empty(/*title*/ ctx[2].toLowerCase() == "joker"
    			? "jokerFont"
    			: "normalFont") + " svelte-suxjp4"))) {
    				attr_dev(h1, "class", h1_class_value);
    			}

    			if (/*line*/ ctx[3]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3$1(ctx);
    					if_block0.c();
    					if_block0.m(div0, t2);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*info*/ ctx[4]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_2$2(ctx);
    					if_block1.c();
    					if_block1.m(div0, t3);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*plot*/ ctx[5]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_1$2(ctx);
    					if_block2.c();
    					if_block2.m(div0, t4);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*imdbID*/ ctx[0] && /*kind*/ ctx[6]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block$6(ctx);
    					if_block3.c();
    					if_block3.m(div0, null);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			update_await_block_branch(info_1, ctx, dirty);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div4);
    			info_1.block.d();
    			info_1.token = null;
    			info_1 = null;
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Featured', slots, []);
    	let { title } = $$props;
    	let { line } = $$props;
    	let { info } = $$props;
    	let { plot } = $$props;
    	let { imdbID } = $$props;
    	let { kind } = $$props;
    	let { inFavorites } = $$props;
    	if (id) imdbID = id;
    	var favsBTN = "";
    	var plBTN = "";
    	var playBTN = "";

    	const handleFavorites = () => {
    		const imdbID = favsBTN.dataset.id;

    		if (favsBTN.innerText.includes("+")) {
    			console.log("Adding ...");
    			let xhr = new XMLHttpRequest();
    			xhr.open("GET", "/api/addToFavorites/" + imdbID, true);

    			xhr.onreadystatechange = function () {
    				if (xhr.readyState == 4 && xhr.status == 200) {
    					$$invalidate(1, inFavorites = true);
    				}
    			};

    			xhr.send();
    		} else if (favsBTN.innerText.includes("-")) {
    			console.log("Removing ...");
    			let xhr = new XMLHttpRequest();
    			xhr.open("GET", "/api/removeFromFavorites/" + imdbID, true);

    			xhr.onreadystatechange = function () {
    				if (xhr.readyState == 4 && xhr.status == 200) {
    					$$invalidate(1, inFavorites = false);
    				}
    			};

    			xhr.send();
    		} else {
    			console.log("Unknown button state");
    		}
    	};

    	const addToPlaylist = playlistID => {
    		const imdbID = favsBTN.dataset.id;
    		let xhr = new XMLHttpRequest();
    		xhr.open("GET", `/api/addToPlaylist/${playlistID}/${imdbID}`, true);

    		xhr.onreadystatechange = function () {
    			if (xhr.readyState == 4 && xhr.status == 200) {
    				const button = document.getElementById(playlistID);
    				button.style.color = "green";
    				button.style.borderColor = "green";
    			}
    		};

    		xhr.send();
    	};

    	const handlePlaylist = () => {
    		plBTN.dataset.id;
    		const modal = document.getElementById("playlistModal");

    		if (modal.style.display == "flex") {
    			modal.style.display = "none";
    			document.getElementsByTagName("html")[0].style.overflow = "scroll";
    		} else {
    			modal.style.display = "flex";
    			document.getElementsByTagName("html")[0].style.overflow = "hidden";
    		}
    	};

    	const play = () => {
    		let url = `/watch/${playBTN.dataset.id}/`;
    		if (kind) url += `?kind=${kind}`;
    		location = url;
    	};

    	const writable_props = ['title', 'line', 'info', 'plot', 'imdbID', 'kind', 'inFavorites'];

    	Object_1$6.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$6.warn(`<Featured> was created with unknown prop '${key}'`);
    	});

    	function a0_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			playBTN = $$value;
    			$$invalidate(9, playBTN);
    		});
    	}

    	const click_handler = () => play();

    	function a1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			favsBTN = $$value;
    			$$invalidate(7, favsBTN);
    		});
    	}

    	const click_handler_1 = () => handleFavorites();

    	function a2_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			plBTN = $$value;
    			$$invalidate(8, plBTN);
    		});
    	}

    	const click_handler_2 = () => handlePlaylist();

    	const func = res => {
    		return JSON.parse(res).results;
    	};

    	const click_handler_3 = d => {
    		addToPlaylist(d.playlistID);
    	};

    	const click_handler_4 = () => {
    		handlePlaylist();
    	};

    	$$self.$$set = $$props => {
    		if ('title' in $$props) $$invalidate(2, title = $$props.title);
    		if ('line' in $$props) $$invalidate(3, line = $$props.line);
    		if ('info' in $$props) $$invalidate(4, info = $$props.info);
    		if ('plot' in $$props) $$invalidate(5, plot = $$props.plot);
    		if ('imdbID' in $$props) $$invalidate(0, imdbID = $$props.imdbID);
    		if ('kind' in $$props) $$invalidate(6, kind = $$props.kind);
    		if ('inFavorites' in $$props) $$invalidate(1, inFavorites = $$props.inFavorites);
    	};

    	$$self.$capture_state = () => ({
    		title,
    		line,
    		info,
    		plot,
    		imdbID,
    		kind,
    		inFavorites,
    		axios,
    		favsBTN,
    		plBTN,
    		playBTN,
    		handleFavorites,
    		addToPlaylist,
    		handlePlaylist,
    		play
    	});

    	$$self.$inject_state = $$props => {
    		if ('title' in $$props) $$invalidate(2, title = $$props.title);
    		if ('line' in $$props) $$invalidate(3, line = $$props.line);
    		if ('info' in $$props) $$invalidate(4, info = $$props.info);
    		if ('plot' in $$props) $$invalidate(5, plot = $$props.plot);
    		if ('imdbID' in $$props) $$invalidate(0, imdbID = $$props.imdbID);
    		if ('kind' in $$props) $$invalidate(6, kind = $$props.kind);
    		if ('inFavorites' in $$props) $$invalidate(1, inFavorites = $$props.inFavorites);
    		if ('favsBTN' in $$props) $$invalidate(7, favsBTN = $$props.favsBTN);
    		if ('plBTN' in $$props) $$invalidate(8, plBTN = $$props.plBTN);
    		if ('playBTN' in $$props) $$invalidate(9, playBTN = $$props.playBTN);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		imdbID,
    		inFavorites,
    		title,
    		line,
    		info,
    		plot,
    		kind,
    		favsBTN,
    		plBTN,
    		playBTN,
    		handleFavorites,
    		addToPlaylist,
    		handlePlaylist,
    		play,
    		a0_binding,
    		click_handler,
    		a1_binding,
    		click_handler_1,
    		a2_binding,
    		click_handler_2,
    		func,
    		click_handler_3,
    		click_handler_4
    	];
    }

    class Featured extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
    			title: 2,
    			line: 3,
    			info: 4,
    			plot: 5,
    			imdbID: 0,
    			kind: 6,
    			inFavorites: 1
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Featured",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*title*/ ctx[2] === undefined && !('title' in props)) {
    			console_1$6.warn("<Featured> was created without expected prop 'title'");
    		}

    		if (/*line*/ ctx[3] === undefined && !('line' in props)) {
    			console_1$6.warn("<Featured> was created without expected prop 'line'");
    		}

    		if (/*info*/ ctx[4] === undefined && !('info' in props)) {
    			console_1$6.warn("<Featured> was created without expected prop 'info'");
    		}

    		if (/*plot*/ ctx[5] === undefined && !('plot' in props)) {
    			console_1$6.warn("<Featured> was created without expected prop 'plot'");
    		}

    		if (/*imdbID*/ ctx[0] === undefined && !('imdbID' in props)) {
    			console_1$6.warn("<Featured> was created without expected prop 'imdbID'");
    		}

    		if (/*kind*/ ctx[6] === undefined && !('kind' in props)) {
    			console_1$6.warn("<Featured> was created without expected prop 'kind'");
    		}

    		if (/*inFavorites*/ ctx[1] === undefined && !('inFavorites' in props)) {
    			console_1$6.warn("<Featured> was created without expected prop 'inFavorites'");
    		}
    	}

    	get title() {
    		throw new Error("<Featured>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Featured>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get line() {
    		throw new Error("<Featured>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set line(value) {
    		throw new Error("<Featured>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get info() {
    		throw new Error("<Featured>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set info(value) {
    		throw new Error("<Featured>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get plot() {
    		throw new Error("<Featured>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set plot(value) {
    		throw new Error("<Featured>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get imdbID() {
    		throw new Error("<Featured>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set imdbID(value) {
    		throw new Error("<Featured>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get kind() {
    		throw new Error("<Featured>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set kind(value) {
    		throw new Error("<Featured>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inFavorites() {
    		throw new Error("<Featured>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inFavorites(value) {
    		throw new Error("<Featured>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    createCommonjsModule(function (module, exports) {
    !function(t,e,n,r,o){if("customElements"in n)o();else {if(n.AWAITING_WEB_COMPONENTS_POLYFILL)return void n.AWAITING_WEB_COMPONENTS_POLYFILL.then(o);var a=n.AWAITING_WEB_COMPONENTS_POLYFILL=f();a.then(o);var i=n.WEB_COMPONENTS_POLYFILL||"//cdnjs.cloudflare.com/ajax/libs/webcomponentsjs/2.0.2/webcomponents-bundle.js",s=n.ES6_CORE_POLYFILL||"//cdnjs.cloudflare.com/ajax/libs/core-js/2.5.3/core.min.js";"Promise"in n?c(i).then((function(){a.isDone=!0,a.exec();})):c(s).then((function(){c(i).then((function(){a.isDone=!0,a.exec();}));}));}function f(){var t=[];return t.isDone=!1,t.exec=function(){t.splice(0).forEach((function(t){t();}));},t.then=function(e){return t.isDone?e():t.push(e),t},t}function c(t){var e=f(),n=r.createElement("script");return n.type="text/javascript",n.readyState?n.onreadystatechange=function(){"loaded"!=n.readyState&&"complete"!=n.readyState||(n.onreadystatechange=null,e.isDone=!0,e.exec());}:n.onload=function(){e.isDone=!0,e.exec();},n.src=t,r.getElementsByTagName("head")[0].appendChild(n),n.then=e.then,n}}(0,0,window,document,(function(){var e;e=function(){return function(t){var e={};function n(r){if(e[r])return e[r].exports;var o=e[r]={i:r,l:!1,exports:{}};return t[r].call(o.exports,o,o.exports,n),o.l=!0,o.exports}return n.m=t,n.c=e,n.d=function(t,e,r){n.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:r});},n.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0});},n.t=function(t,e){if(1&e&&(t=n(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var o in t)n.d(r,o,function(e){return t[e]}.bind(null,o));return r},n.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return n.d(e,"a",e),e},n.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},n.p="",n(n.s=5)}([function(t,e){t.exports=function(t){var e=[];return e.toString=function(){return this.map((function(e){var n=function(t,e){var n,r=t[1]||"",o=t[3];if(!o)return r;if(e&&"function"==typeof btoa){var a=(n=o,"/*# sourceMappingURL=data:application/json;charset=utf-8;base64,"+btoa(unescape(encodeURIComponent(JSON.stringify(n))))+" */"),i=o.sources.map((function(t){return "/*# sourceURL="+o.sourceRoot+t+" */"}));return [r].concat(i).concat([a]).join("\n")}return [r].join("\n")}(e,t);return e[2]?"@media "+e[2]+"{"+n+"}":n})).join("")},e.i=function(t,n){"string"==typeof t&&(t=[[null,t,""]]);for(var r={},o=0;o<this.length;o++){var a=this[o][0];"number"==typeof a&&(r[a]=!0);}for(o=0;o<t.length;o++){var i=t[o];"number"==typeof i[0]&&r[i[0]]||(n&&!i[2]?i[2]=n:n&&(i[2]="("+i[2]+") and ("+n+")"),e.push(i));}},e};},function(t,e,n){var r=n(3);t.exports="string"==typeof r?r:r.toString();},function(t,e,n){var r=n(4);t.exports="string"==typeof r?r:r.toString();},function(t,e,n){(t.exports=n(0)(!1)).push([t.i,"@-webkit-keyframes spin{0%{-webkit-transform:rotate(0);transform:rotate(0)}to{-webkit-transform:rotate(359deg);transform:rotate(359deg)}}@keyframes spin{0%{-webkit-transform:rotate(0);transform:rotate(0)}to{-webkit-transform:rotate(359deg);transform:rotate(359deg)}}@-webkit-keyframes burst{0%{-webkit-transform:scale(1);transform:scale(1);opacity:1}90%{-webkit-transform:scale(1.5);transform:scale(1.5);opacity:0}}@keyframes burst{0%{-webkit-transform:scale(1);transform:scale(1);opacity:1}90%{-webkit-transform:scale(1.5);transform:scale(1.5);opacity:0}}@-webkit-keyframes flashing{0%{opacity:1}45%{opacity:0}90%{opacity:1}}@keyframes flashing{0%{opacity:1}45%{opacity:0}90%{opacity:1}}@-webkit-keyframes fade-left{0%{-webkit-transform:translateX(0);transform:translateX(0);opacity:1}75%{-webkit-transform:translateX(-20px);transform:translateX(-20px);opacity:0}}@keyframes fade-left{0%{-webkit-transform:translateX(0);transform:translateX(0);opacity:1}75%{-webkit-transform:translateX(-20px);transform:translateX(-20px);opacity:0}}@-webkit-keyframes fade-right{0%{-webkit-transform:translateX(0);transform:translateX(0);opacity:1}75%{-webkit-transform:translateX(20px);transform:translateX(20px);opacity:0}}@keyframes fade-right{0%{-webkit-transform:translateX(0);transform:translateX(0);opacity:1}75%{-webkit-transform:translateX(20px);transform:translateX(20px);opacity:0}}@-webkit-keyframes fade-up{0%{-webkit-transform:translateY(0);transform:translateY(0);opacity:1}75%{-webkit-transform:translateY(-20px);transform:translateY(-20px);opacity:0}}@keyframes fade-up{0%{-webkit-transform:translateY(0);transform:translateY(0);opacity:1}75%{-webkit-transform:translateY(-20px);transform:translateY(-20px);opacity:0}}@-webkit-keyframes fade-down{0%{-webkit-transform:translateY(0);transform:translateY(0);opacity:1}75%{-webkit-transform:translateY(20px);transform:translateY(20px);opacity:0}}@keyframes fade-down{0%{-webkit-transform:translateY(0);transform:translateY(0);opacity:1}75%{-webkit-transform:translateY(20px);transform:translateY(20px);opacity:0}}@-webkit-keyframes tada{0%{-webkit-transform:scaleX(1);transform:scaleX(1)}10%,20%{-webkit-transform:scale3d(.95,.95,.95) rotate(-10deg);transform:scale3d(.95,.95,.95) rotate(-10deg)}30%,50%,70%,90%{-webkit-transform:scaleX(1) rotate(10deg);transform:scaleX(1) rotate(10deg)}40%,60%,80%{-webkit-transform:scaleX(1) rotate(-10deg);transform:scaleX(1) rotate(-10deg)}to{-webkit-transform:scaleX(1);transform:scaleX(1)}}@keyframes tada{0%{-webkit-transform:scaleX(1);transform:scaleX(1)}10%,20%{-webkit-transform:scale3d(.95,.95,.95) rotate(-10deg);transform:scale3d(.95,.95,.95) rotate(-10deg)}30%,50%,70%,90%{-webkit-transform:scaleX(1) rotate(10deg);transform:scaleX(1) rotate(10deg)}40%,60%,80%{-webkit-transform:rotate(-10deg);transform:rotate(-10deg)}to{-webkit-transform:scaleX(1);transform:scaleX(1)}}.bx-spin,.bx-spin-hover:hover{-webkit-animation:spin 2s linear infinite;animation:spin 2s linear infinite}.bx-tada,.bx-tada-hover:hover{-webkit-animation:tada 1.5s ease infinite;animation:tada 1.5s ease infinite}.bx-flashing,.bx-flashing-hover:hover{-webkit-animation:flashing 1.5s infinite linear;animation:flashing 1.5s infinite linear}.bx-burst,.bx-burst-hover:hover{-webkit-animation:burst 1.5s infinite linear;animation:burst 1.5s infinite linear}.bx-fade-up,.bx-fade-up-hover:hover{-webkit-animation:fade-up 1.5s infinite linear;animation:fade-up 1.5s infinite linear}.bx-fade-down,.bx-fade-down-hover:hover{-webkit-animation:fade-down 1.5s infinite linear;animation:fade-down 1.5s infinite linear}.bx-fade-left,.bx-fade-left-hover:hover{-webkit-animation:fade-left 1.5s infinite linear;animation:fade-left 1.5s infinite linear}.bx-fade-right,.bx-fade-right-hover:hover{-webkit-animation:fade-right 1.5s infinite linear;animation:fade-right 1.5s infinite linear}",""]);},function(t,e,n){(t.exports=n(0)(!1)).push([t.i,'.bx-rotate-90{transform:rotate(90deg);-ms-filter:"progid:DXImageTransform.Microsoft.BasicImage(rotation=1)"}.bx-rotate-180{transform:rotate(180deg);-ms-filter:"progid:DXImageTransform.Microsoft.BasicImage(rotation=2)"}.bx-rotate-270{transform:rotate(270deg);-ms-filter:"progid:DXImageTransform.Microsoft.BasicImage(rotation=3)"}.bx-flip-horizontal{transform:scaleX(-1);-ms-filter:"progid:DXImageTransform.Microsoft.BasicImage(rotation=0, mirror=1)"}.bx-flip-vertical{transform:scaleY(-1);-ms-filter:"progid:DXImageTransform.Microsoft.BasicImage(rotation=2, mirror=1)"}',""]);},function(t,e,n){n.r(e),n.d(e,"BoxIconElement",(function(){return g}));var r,o,a,i,s=n(1),f=n.n(s),c=n(2),l=n.n(c),m="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},u=function(){function t(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r);}}return function(e,n,r){return n&&t(e.prototype,n),r&&t(e,r),e}}(),d=(o=(r=Object).getPrototypeOf||function(t){return t.__proto__},a=r.setPrototypeOf||function(t,e){return t.__proto__=e,t},i="object"===("undefined"==typeof Reflect?"undefined":m(Reflect))?Reflect.construct:function(t,e,n){var r,o=[null];return o.push.apply(o,e),r=t.bind.apply(t,o),a(new r,n.prototype)},function(t){var e=o(t);return a(t,a((function(){return i(e,arguments,o(this).constructor)}),e))}),p=window,b={},y=document.createElement("template"),h=function(){return !!p.ShadyCSS};y.innerHTML='\n<style>\n:host {\n  display: inline-block;\n  font-size: initial;\n  box-sizing: border-box;\n  width: 24px;\n  height: 24px;\n}\n:host([size=xs]) {\n    width: 0.8rem;\n    height: 0.8rem;\n}\n:host([size=sm]) {\n    width: 1.55rem;\n    height: 1.55rem;\n}\n:host([size=md]) {\n    width: 2.25rem;\n    height: 2.25rem;\n}\n:host([size=lg]) {\n    width: 3.0rem;\n    height: 3.0rem;\n}\n\n:host([size]:not([size=""]):not([size=xs]):not([size=sm]):not([size=md]):not([size=lg])) {\n    width: auto;\n    height: auto;\n}\n:host([pull=left]) #icon {\n    float: left;\n    margin-right: .3em!important;\n}\n:host([pull=right]) #icon {\n    float: right;\n    margin-left: .3em!important;\n}\n:host([border=square]) #icon {\n    padding: .25em;\n    border: .07em solid rgba(0,0,0,.1);\n    border-radius: .25em;\n}\n:host([border=circle]) #icon {\n    padding: .25em;\n    border: .07em solid rgba(0,0,0,.1);\n    border-radius: 50%;\n}\n#icon,\nsvg {\n  width: 100%;\n  height: 100%;\n}\n#icon {\n    box-sizing: border-box;\n} \n'+f.a+"\n"+l.a+'\n</style>\n<div id="icon"></div>';var g=d(function(t){function e(){!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,e);var t=function(t,e){if(!t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return !e||"object"!=typeof e&&"function"!=typeof e?t:e}(this,(e.__proto__||Object.getPrototypeOf(e)).call(this));return t.$ui=t.attachShadow({mode:"open"}),t.$ui.appendChild(t.ownerDocument.importNode(y.content,!0)),h()&&p.ShadyCSS.styleElement(t),t._state={$iconHolder:t.$ui.getElementById("icon"),type:t.getAttribute("type")},t}return function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e);t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(Object.setPrototypeOf?Object.setPrototypeOf(t,e):t.__proto__=e);}(e,HTMLElement),u(e,null,[{key:"getIconSvg",value:function(t,e){var n=this.cdnUrl+"/regular/bx-"+t+".svg";return "solid"===e?n=this.cdnUrl+"/solid/bxs-"+t+".svg":"logo"===e&&(n=this.cdnUrl+"/logos/bxl-"+t+".svg"),n&&b[n]||(b[n]=new Promise((function(t,e){var r=new XMLHttpRequest;r.addEventListener("load",(function(){this.status<200||this.status>=300?e(new Error(this.status+" "+this.responseText)):t(this.responseText);})),r.onerror=e,r.onabort=e,r.open("GET",n),r.send();}))),b[n]}},{key:"define",value:function(t){t=t||this.tagName,h()&&p.ShadyCSS.prepareTemplate(y,t),customElements.define(t,this);}},{key:"cdnUrl",get:function(){return "//unpkg.com/boxicons@2.1.4/svg"}},{key:"tagName",get:function(){return "box-icon"}},{key:"observedAttributes",get:function(){return ["type","name","color","size","rotate","flip","animation","border","pull"]}}]),u(e,[{key:"attributeChangedCallback",value:function(t,e,n){var r=this._state.$iconHolder;switch(t){case"type":!function(t,e,n){var r=t._state;r.$iconHolder.textContent="",r.type&&(r.type=null),r.type=!n||"solid"!==n&&"logo"!==n?"regular":n,void 0!==r.currentName&&t.constructor.getIconSvg(r.currentName,r.type).then((function(t){r.type===n&&(r.$iconHolder.innerHTML=t);})).catch((function(t){console.error("Failed to load icon: "+r.currentName+"\n"+t);}));}(this,0,n);break;case"name":!function(t,e,n){var r=t._state;r.currentName=n,r.$iconHolder.textContent="",n&&void 0!==r.type&&t.constructor.getIconSvg(n,r.type).then((function(t){r.currentName===n&&(r.$iconHolder.innerHTML=t);})).catch((function(t){console.error("Failed to load icon: "+n+"\n"+t);}));}(this,0,n);break;case"color":r.style.fill=n||"";break;case"size":!function(t,e,n){var r=t._state;r.size&&(r.$iconHolder.style.width=r.$iconHolder.style.height="",r.size=r.sizeType=null),n&&!/^(xs|sm|md|lg)$/.test(r.size)&&(r.size=n.trim(),r.$iconHolder.style.width=r.$iconHolder.style.height=r.size);}(this,0,n);break;case"rotate":e&&r.classList.remove("bx-rotate-"+e),n&&r.classList.add("bx-rotate-"+n);break;case"flip":e&&r.classList.remove("bx-flip-"+e),n&&r.classList.add("bx-flip-"+n);break;case"animation":e&&r.classList.remove("bx-"+e),n&&r.classList.add("bx-"+n);}}},{key:"connectedCallback",value:function(){h()&&p.ShadyCSS.styleElement(this);}}]),e}());e.default=g,g.define();}])},module.exports=e();}));

    });

    /* src\Home.svelte generated by Svelte v3.49.0 */

    const { Object: Object_1$5, console: console_1$5 } = globals;
    const file$6 = "src\\Home.svelte";

    function get_each_context$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[16] = list[i];
    	return child_ctx;
    }

    // (109:1) {#if showFt == "true"}
    function create_if_block_2$1(ctx) {
    	let featured;
    	let current;
    	const featured_spread_levels = [/*featuredMetadata*/ ctx[3]];
    	let featured_props = {};

    	for (let i = 0; i < featured_spread_levels.length; i += 1) {
    		featured_props = assign(featured_props, featured_spread_levels[i]);
    	}

    	featured = new Featured({ props: featured_props, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(featured.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(featured, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const featured_changes = (dirty & /*featuredMetadata*/ 8)
    			? get_spread_update(featured_spread_levels, [get_spread_object(/*featuredMetadata*/ ctx[3])])
    			: {};

    			featured.$set(featured_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(featured.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(featured.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(featured, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(109:1) {#if showFt == \\\"true\\\"}",
    		ctx
    	});

    	return block;
    }

    // (114:2) {#if showG == "true"}
    function create_if_block$5(ctx) {
    	let each_1_anchor;
    	let each_value = /*homeItem*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$6(get_each_context$6(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*axios, homeItem, JSON, Object, view, scrollRight, scrollLeft*/ 116) {
    				each_value = /*homeItem*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$6(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$6(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(114:2) {#if showG == \\\"true\\\"}",
    		ctx
    	});

    	return block;
    }

    // (116:4) {#if m.enabled == true}
    function create_if_block_1$1(ctx) {
    	let await_block_anchor;
    	let promise;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block$5,
    		then: create_then_block$5,
    		catch: create_catch_block$5,
    		value: 15,
    		error: 19
    	};

    	handle_promise(
    		promise = axios.get(/*m*/ ctx[12].url, {
    			transformResponse: /*func*/ ctx[8],
    			responseType: 'json'
    		}),
    		info
    	);

    	const block = {
    		c: function create() {
    			await_block_anchor = empty();
    			info.block.c();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, await_block_anchor, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*homeItem*/ 4 && promise !== (promise = axios.get(/*m*/ ctx[12].url, {
    				transformResponse: /*func*/ ctx[8],
    				responseType: 'json'
    			})) && handle_promise(promise, info)) ; else {
    				update_await_block_branch(info, ctx, dirty);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(await_block_anchor);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(116:4) {#if m.enabled == true}",
    		ctx
    	});

    	return block;
    }

    // (134:5) {:catch error}
    function create_catch_block$5(ctx) {
    	let p;
    	let t0;
    	let t1_value = /*error*/ ctx[19].message + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("Error: ");
    			t1 = text(t1_value);
    			t2 = space();
    			set_style(p, "display", "none");
    			add_location(p, file$6, 134, 6, 3700);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			insert_dev(target, t2, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*homeItem*/ 4 && t1_value !== (t1_value = /*error*/ ctx[19].message + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$5.name,
    		type: "catch",
    		source: "(134:5) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (119:5) {:then resp}
    function create_then_block$5(ctx) {
    	let div0;
    	let box_icon0;
    	let t0;
    	let div1;
    	let box_icon1;
    	let t1;
    	let div3;
    	let div2;
    	let t2;
    	let div3_id_value;
    	let t3;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[9](/*m*/ ctx[12]);
    	}

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[10](/*m*/ ctx[12]);
    	}

    	let each_value_1 = Object.values(/*resp*/ ctx[15].data);
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			box_icon0 = element("box-icon");
    			t0 = space();
    			div1 = element("div");
    			box_icon1 = element("box-icon");
    			t1 = space();
    			div3 = element("div");
    			div2 = element("div");
    			t2 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t3 = space();
    			set_custom_element_data(box_icon0, "name", "chevron-left");
    			set_custom_element_data(box_icon0, "color", "white");
    			set_custom_element_data(box_icon0, "class", "svelte-ik8q7s");
    			add_location(box_icon0, file$6, 121, 6, 3125);
    			attr_dev(div0, "class", "arrows left svelte-ik8q7s");
    			add_location(div0, file$6, 120, 5, 3047);
    			set_custom_element_data(box_icon1, "name", "chevron-right");
    			set_custom_element_data(box_icon1, "color", "white");
    			set_custom_element_data(box_icon1, "class", "svelte-ik8q7s");
    			add_location(box_icon1, file$6, 124, 6, 3280);
    			attr_dev(div1, "class", "arrows right svelte-ik8q7s");
    			add_location(div1, file$6, 123, 5, 3200);
    			attr_dev(div2, "class", "placeholder svelte-ik8q7s");
    			add_location(div2, file$6, 127, 6, 3401);
    			attr_dev(div3, "id", div3_id_value = "" + (/*m*/ ctx[12].title + "Box"));
    			attr_dev(div3, "class", "outer svelte-ik8q7s");
    			add_location(div3, file$6, 126, 5, 3356);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, box_icon0);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, box_icon1);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div3, t2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div3, null);
    			}

    			insert_dev(target, t3, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "click", click_handler, false, false, false),
    					listen_dev(div1, "click", click_handler_1, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*Object, axios, homeItem, JSON, view*/ 20) {
    				each_value_1 = Object.values(/*resp*/ ctx[15].data);
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div3, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if (dirty & /*homeItem*/ 4 && div3_id_value !== (div3_id_value = "" + (/*m*/ ctx[12].title + "Box"))) {
    				attr_dev(div3, "id", div3_id_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div3);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t3);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$5.name,
    		type: "then",
    		source: "(119:5) {:then resp}",
    		ctx
    	});

    	return block;
    }

    // (129:6) {#each Object.values(resp.data) as d}
    function create_each_block_1(ctx) {
    	let img;
    	let img_id_value;
    	let img_src_value;
    	let img_alt_value;
    	let mounted;
    	let dispose;

    	function click_handler_2() {
    		return /*click_handler_2*/ ctx[11](/*d*/ ctx[16]);
    	}

    	const block = {
    		c: function create() {
    			img = element("img");
    			attr_dev(img, "class", "clickablePoster svelte-ik8q7s");
    			attr_dev(img, "id", img_id_value = /*d*/ ctx[16].id);
    			if (!src_url_equal(img.src, img_src_value = "/api/poster/" + /*d*/ ctx[16].id + "?do=show")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*d*/ ctx[16].title);
    			add_location(img, file$6, 129, 7, 3486);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);

    			if (!mounted) {
    				dispose = listen_dev(img, "click", click_handler_2, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*homeItem*/ 4 && img_id_value !== (img_id_value = /*d*/ ctx[16].id)) {
    				attr_dev(img, "id", img_id_value);
    			}

    			if (dirty & /*homeItem*/ 4 && !src_url_equal(img.src, img_src_value = "/api/poster/" + /*d*/ ctx[16].id + "?do=show")) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*homeItem*/ 4 && img_alt_value !== (img_alt_value = /*d*/ ctx[16].title)) {
    				attr_dev(img, "alt", img_alt_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(129:6) {#each Object.values(resp.data) as d}",
    		ctx
    	});

    	return block;
    }

    // (117:119)         <p style="display: none;">Loading ...</p>       {:then resp}
    function create_pending_block$5(ctx) {
    	let p;
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Loading ...";
    			t1 = space();
    			set_style(p, "display", "none");
    			add_location(p, file$6, 117, 6, 2946);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$5.name,
    		type: "pending",
    		source: "(117:119)         <p style=\\\"display: none;\\\">Loading ...</p>       {:then resp}",
    		ctx
    	});

    	return block;
    }

    // (115:3) {#each homeItem as m}
    function create_each_block$6(ctx) {
    	let if_block_anchor;
    	let if_block = /*m*/ ctx[12].enabled == true && create_if_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*m*/ ctx[12].enabled == true) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$6.name,
    		type: "each",
    		source: "(115:3) {#each homeItem as m}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let main;
    	let nav;
    	let t0;
    	let t1;
    	let div;
    	let current;

    	nav = new Nav({
    			props: { active: "home" },
    			$$inline: true
    		});

    	let if_block0 = /*showFt*/ ctx[1] == "true" && create_if_block_2$1(ctx);
    	let if_block1 = /*showG*/ ctx[0] == "true" && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(nav.$$.fragment);
    			t0 = space();
    			if (if_block0) if_block0.c();
    			t1 = space();
    			div = element("div");
    			if (if_block1) if_block1.c();
    			attr_dev(div, "id", "content");
    			attr_dev(div, "class", "content svelte-ik8q7s");
    			add_location(div, file$6, 111, 1, 2660);
    			attr_dev(main, "class", "svelte-ik8q7s");
    			add_location(main, file$6, 106, 0, 2558);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(nav, main, null);
    			append_dev(main, t0);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t1);
    			append_dev(main, div);
    			if (if_block1) if_block1.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*showFt*/ ctx[1] == "true") {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*showFt*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_2$1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(main, t1);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*showG*/ ctx[0] == "true") {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$5(ctx);
    					if_block1.c();
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(nav.$$.fragment, local);
    			transition_in(if_block0);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(nav.$$.fragment, local);
    			transition_out(if_block0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(nav);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function preloadImage$1(url) {
    	var img = new Image();
    	img.src = url;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Home', slots, []);
    	let { showG } = $$props;
    	let { id } = $$props;
    	let { showFt } = $$props;
    	var homeItem = [];

    	if (showG == "true") {
    		axios({
    			method: 'get',
    			url: "/api/homeMenu",
    			transformResponse: res => {
    				return JSON.parse(res);
    			},
    			responseType: 'json'
    		}).then(response => {
    			const data = response.data;
    			$$invalidate(2, homeItem = data);
    			window.scrollTo(0, 0);
    		}).catch(error => {
    			console.log(error);
    		});
    	}

    	var featuredMetadata = { title: "Loading ..." };

    	// if id ain't  defined get featured from api
    	if (!id) {
    		axios({
    			method: 'get',
    			url: "/api/featured",
    			transformResponse: res => {
    				return JSON.parse(res);
    			},
    			responseType: 'json'
    		}).then(response => {
    			const data = response.data;

    			$$invalidate(3, featuredMetadata = {
    				img: data.img,
    				title: data.title,
    				line: data.line,
    				info: data.info,
    				plot: data.plot,
    				imdbID: data.imdbID,
    				kind: data.kind,
    				inFavorites: data.inFavorites,
    				episodeCount: data.episodeCount
    			});

    			window.scrollTo(0, 0);
    		}).catch(error => {
    			console.log(error);
    		});
    	}

    	preloadImage$1("/static/img/loading.gif");

    	// view replace's featured with custom item
    	const view = id => {
    		preloadImage$1(`/api/banner/${id}?do=show`);
    		let item = document.getElementById(id);
    		let before = "";

    		if (item) {
    			before = item.src;
    			item.src = "/static/img/loading.gif";
    		}

    		axios({
    			method: 'get',
    			url: "/api/getMovieInfo/" + id,
    			transformResponse: res => {
    				return JSON.parse(res);
    			},
    			responseType: 'json'
    		}).then(response => {
    			const data = response.data;
    			$$invalidate(3, featuredMetadata.img = `/api/poster/${id}?do=show`, featuredMetadata);
    			$$invalidate(3, featuredMetadata.title = data.title, featuredMetadata);
    			$$invalidate(3, featuredMetadata.line = "", featuredMetadata);
    			$$invalidate(3, featuredMetadata.info = data.info, featuredMetadata);
    			$$invalidate(3, featuredMetadata.plot = data.plot, featuredMetadata);
    			$$invalidate(3, featuredMetadata.imdbID = id, featuredMetadata);
    			$$invalidate(3, featuredMetadata.kind = data.kind, featuredMetadata);
    			$$invalidate(3, featuredMetadata.inFavorites = data.inFavorites, featuredMetadata);
    			window.scrollTo(0, 0);
    			if (item) item.src = before;
    		}).catch(error => {
    			console.log(error);
    		});
    	};

    	if (id) {
    		view(id);
    	}

    	const scrollRight = id => {
    		let item = document.getElementById(id);
    		item.scrollLeft = item.scrollLeft + 500;
    	};

    	const scrollLeft = id => {
    		let item = document.getElementById(id);
    		item.scrollLeft = item.scrollLeft - 500;
    	};

    	const writable_props = ['showG', 'id', 'showFt'];

    	Object_1$5.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$5.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	const func = res => {
    		return JSON.parse(res).results;
    	};

    	const click_handler = m => {
    		scrollLeft(`${m.title}Box`);
    	};

    	const click_handler_1 = m => {
    		scrollRight(`${m.title}Box`);
    	};

    	const click_handler_2 = d => view(d.id);

    	$$self.$$set = $$props => {
    		if ('showG' in $$props) $$invalidate(0, showG = $$props.showG);
    		if ('id' in $$props) $$invalidate(7, id = $$props.id);
    		if ('showFt' in $$props) $$invalidate(1, showFt = $$props.showFt);
    	};

    	$$self.$capture_state = () => ({
    		Nav,
    		Featured,
    		axios,
    		showG,
    		id,
    		showFt,
    		homeItem,
    		featuredMetadata,
    		preloadImage: preloadImage$1,
    		view,
    		scrollRight,
    		scrollLeft
    	});

    	$$self.$inject_state = $$props => {
    		if ('showG' in $$props) $$invalidate(0, showG = $$props.showG);
    		if ('id' in $$props) $$invalidate(7, id = $$props.id);
    		if ('showFt' in $$props) $$invalidate(1, showFt = $$props.showFt);
    		if ('homeItem' in $$props) $$invalidate(2, homeItem = $$props.homeItem);
    		if ('featuredMetadata' in $$props) $$invalidate(3, featuredMetadata = $$props.featuredMetadata);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		showG,
    		showFt,
    		homeItem,
    		featuredMetadata,
    		view,
    		scrollRight,
    		scrollLeft,
    		id,
    		func,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { showG: 0, id: 7, showFt: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*showG*/ ctx[0] === undefined && !('showG' in props)) {
    			console_1$5.warn("<Home> was created without expected prop 'showG'");
    		}

    		if (/*id*/ ctx[7] === undefined && !('id' in props)) {
    			console_1$5.warn("<Home> was created without expected prop 'id'");
    		}

    		if (/*showFt*/ ctx[1] === undefined && !('showFt' in props)) {
    			console_1$5.warn("<Home> was created without expected prop 'showFt'");
    		}
    	}

    	get showG() {
    		throw new Error("<Home>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showG(value) {
    		throw new Error("<Home>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Home>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Home>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showFt() {
    		throw new Error("<Home>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showFt(value) {
    		throw new Error("<Home>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Favorites.svelte generated by Svelte v3.49.0 */

    const { Object: Object_1$4, console: console_1$4 } = globals;
    const file$5 = "src\\Favorites.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i][0];
    	child_ctx[5] = list[i][1];
    	return child_ctx;
    }

    // (36:8) {:catch error}
    function create_catch_block$4(ctx) {
    	let p;
    	let t0;
    	let t1_value = /*error*/ ctx[8].message + "";
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("Error: ");
    			t1 = text(t1_value);
    			set_style(p, "display", "none");
    			add_location(p, file$5, 36, 12, 1201);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$4.name,
    		type: "catch",
    		source: "(36:8) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (28:8) {:then resp}
    function create_then_block$4(ctx) {
    	let div;
    	let each_value = Object.entries(/*resp*/ ctx[3].data);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "grid-container svelte-14wlead");
    			add_location(div, file$5, 28, 12, 807);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*window, Object, axios, JSON*/ 0) {
    				each_value = Object.entries(/*resp*/ ctx[3].data);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$4.name,
    		type: "then",
    		source: "(28:8) {:then resp}",
    		ctx
    	});

    	return block;
    }

    // (30:12) {#each Object.entries(resp.data) as [i, d]}
    function create_each_block$5(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let t;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[1](/*d*/ ctx[5]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			t = space();
    			if (!src_url_equal(img.src, img_src_value = "/api/poster/" + /*d*/ ctx[5].id + "?do=show")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Movie");
    			set_style(img, "width", "100%");
    			attr_dev(img, "class", "svelte-14wlead");
    			add_location(img, file$5, 31, 20, 1026);
    			attr_dev(div, "class", "grid-item card svelte-14wlead");
    			add_location(div, file$5, 30, 16, 910);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, t);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(30:12) {#each Object.entries(resp.data) as [i, d]}",
    		ctx
    	});

    	return block;
    }

    // (26:134)               <p style="display: none;">Loading ...</p>          {:then resp}
    function create_pending_block$4(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Loading ...";
    			set_style(p, "display", "none");
    			add_location(p, file$5, 26, 12, 730);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$4.name,
    		type: "pending",
    		source: "(26:134)               <p style=\\\"display: none;\\\">Loading ...</p>          {:then resp}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let main;
    	let nav;
    	let t;
    	let div;
    	let current;

    	nav = new Nav({
    			props: {
    				active: "favorites",
    				scrollEffect: "false"
    			},
    			$$inline: true
    		});

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block$4,
    		then: create_then_block$4,
    		catch: create_catch_block$4,
    		value: 3,
    		error: 8
    	};

    	handle_promise(
    		axios.get("/api/favorites/", {
    			transformResponse: /*func*/ ctx[0],
    			responseType: 'json'
    		}),
    		info
    	);

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(nav.$$.fragment);
    			t = space();
    			div = element("div");
    			info.block.c();
    			attr_dev(div, "class", "content");
    			add_location(div, file$5, 24, 4, 559);
    			attr_dev(main, "class", "svelte-14wlead");
    			add_location(main, file$5, 22, 0, 498);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(nav, main, null);
    			append_dev(main, t);
    			append_dev(main, div);
    			info.block.m(div, info.anchor = null);
    			info.mount = () => div;
    			info.anchor = null;
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			update_await_block_branch(info, ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(nav.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(nav.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(nav);
    			info.block.d();
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Favorites', slots, []);
    	let addons = [];

    	axios({
    		method: 'get',
    		url: "/api/addons",
    		transformResponse: res => {
    			return JSON.parse(res);
    		},
    		responseType: 'json'
    	}).then(response => {
    		const data = response.data;

    		data.forEach(element => {
    			if (element.open) {
    				addons.push(element);
    			}
    		});
    	}).catch(error => {
    		console.log(error);
    	});

    	const writable_props = [];

    	Object_1$4.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$4.warn(`<Favorites> was created with unknown prop '${key}'`);
    	});

    	const func = res => {
    		return JSON.parse(res).results;
    	};

    	const click_handler = d => {
    		window.location = `/watch/${d.id}/?kind=${d.kind}`;
    	};

    	$$self.$capture_state = () => ({ Nav, axios, addons });

    	$$self.$inject_state = $$props => {
    		if ('addons' in $$props) addons = $$props.addons;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [func, click_handler];
    }

    class Favorites extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Favorites",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\Search.svelte generated by Svelte v3.49.0 */

    const { Object: Object_1$3 } = globals;
    const file$4 = "src\\Search.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (27:4) {#if term}
    function create_if_block$4(ctx) {
    	let div;
    	let promise;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block$3,
    		then: create_then_block$3,
    		catch: create_catch_block$3,
    		value: 6,
    		error: 10
    	};

    	handle_promise(
    		promise = axios.get("/api/search/" + /*term*/ ctx[0], {
    			transformResponse: /*func*/ ctx[4],
    			responseType: 'json'
    		}),
    		info
    	);

    	const block = {
    		c: function create() {
    			div = element("div");
    			info.block.c();
    			attr_dev(div, "id", "grid");
    			attr_dev(div, "class", "svelte-b2rtgt");
    			add_location(div, file$4, 27, 6, 592);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			info.block.m(div, info.anchor = null);
    			info.mount = () => div;
    			info.anchor = null;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*term*/ 1 && promise !== (promise = axios.get("/api/search/" + /*term*/ ctx[0], {
    				transformResponse: /*func*/ ctx[4],
    				responseType: 'json'
    			})) && handle_promise(promise, info)) ; else {
    				update_await_block_branch(info, ctx, dirty);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			info.block.d();
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(27:4) {#if term}",
    		ctx
    	});

    	return block;
    }

    // (38:8) {:catch error}
    function create_catch_block$3(ctx) {
    	let p;
    	let t0;
    	let t1_value = /*error*/ ctx[10].message + "";
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("Error: ");
    			t1 = text(t1_value);
    			set_style(p, "display", "none");
    			attr_dev(p, "class", "svelte-b2rtgt");
    			add_location(p, file$4, 38, 10, 1102);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*term*/ 1 && t1_value !== (t1_value = /*error*/ ctx[10].message + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$3.name,
    		type: "catch",
    		source: "(38:8) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (31:8) {:then resp}
    function create_then_block$3(ctx) {
    	let t;
    	let p;
    	let each_value = Object.values(/*resp*/ ctx[6].data.results);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			p = element("p");
    			set_style(p, "display", "none");
    			attr_dev(p, "class", "svelte-b2rtgt");
    			add_location(p, file$4, 36, 10, 1036);
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, t, anchor);
    			insert_dev(target, p, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*view, Object, axios, term, JSON*/ 3) {
    				each_value = Object.values(/*resp*/ ctx[6].data.results);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(t.parentNode, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$3.name,
    		type: "then",
    		source: "(31:8) {:then resp}",
    		ctx
    	});

    	return block;
    }

    // (32:10) {#each Object.values(resp.data.results) as r}
    function create_each_block$4(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[5](/*r*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "/api/poster/" + /*r*/ ctx[7].id + "?do=show")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Poster");
    			attr_dev(img, "class", "svelte-b2rtgt");
    			add_location(img, file$4, 33, 14, 934);
    			attr_dev(div, "class", "item svelte-b2rtgt");
    			add_location(div, file$4, 32, 10, 872);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*term*/ 1 && !src_url_equal(img.src, img_src_value = "/api/poster/" + /*r*/ ctx[7].id + "?do=show")) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(32:10) {#each Object.values(resp.data.results) as r}",
    		ctx
    	});

    	return block;
    }

    // (29:130)             <p style="display: none;"></p>          {:then resp}
    function create_pending_block$3(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			set_style(p, "display", "none");
    			attr_dev(p, "class", "svelte-b2rtgt");
    			add_location(p, file$4, 29, 10, 751);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$3.name,
    		type: "pending",
    		source: "(29:130)             <p style=\\\"display: none;\\\"></p>          {:then resp}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let main;
    	let nav;
    	let t0;
    	let input;
    	let t1;
    	let current;
    	let mounted;
    	let dispose;

    	nav = new Nav({
    			props: { active: "search" },
    			$$inline: true
    		});

    	let if_block = /*term*/ ctx[0] && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(nav.$$.fragment);
    			t0 = space();
    			input = element("input");
    			t1 = space();
    			if (if_block) if_block.c();
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Search ...");
    			attr_dev(input, "class", "svelte-b2rtgt");
    			add_location(input, file$4, 20, 4, 407);
    			attr_dev(main, "class", "svelte-b2rtgt");
    			add_location(main, file$4, 18, 0, 366);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(nav, main, null);
    			append_dev(main, t0);
    			append_dev(main, input);
    			set_input_value(input, /*term*/ ctx[0]);
    			append_dev(main, t1);
    			if (if_block) if_block.m(main, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[2]),
    					listen_dev(input, "keyup", /*keyup_handler*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*term*/ 1 && input.value !== /*term*/ ctx[0]) {
    				set_input_value(input, /*term*/ ctx[0]);
    			}

    			if (/*term*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$4(ctx);
    					if_block.c();
    					if_block.m(main, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(nav.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(nav.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(nav);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function preloadImage(url) {
    	var img = new Image();
    	img.src = url;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Search', slots, []);

    	var term = localStorage.getItem("lastQuery")
    	? localStorage.getItem("lastQuery")
    	: "";

    	const view = id => {
    		preloadImage(`/api/banner/${id}?do=show`);
    		location = `/?showG=false&id=${id}`;
    	};

    	const writable_props = [];

    	Object_1$3.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Search> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		term = this.value;
    		$$invalidate(0, term);
    	}

    	const keyup_handler = () => localStorage.setItem("lastQuery", term);

    	const func = res => {
    		return JSON.parse(res);
    	};

    	const click_handler = r => view(r.id);
    	$$self.$capture_state = () => ({ Nav, axios, term, preloadImage, view });

    	$$self.$inject_state = $$props => {
    		if ('term' in $$props) $$invalidate(0, term = $$props.term);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [term, view, input_input_handler, keyup_handler, func, click_handler];
    }

    class Search extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Search",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\Settings.svelte generated by Svelte v3.49.0 */

    const { console: console_1$3 } = globals;
    const file$3 = "src\\Settings.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (62:12) {#each categories as category}
    function create_each_block$3(ctx) {
    	let button;
    	let t_value = /*category*/ ctx[6]["title"] + "";
    	let t;
    	let button_class_value;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[4](/*category*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*category*/ ctx[6]["enabled"] ? 'enabled' : 'disabled') + " svelte-1ozzfps"));
    			add_location(button, file$3, 62, 16, 1736);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*categories*/ 1 && t_value !== (t_value = /*category*/ ctx[6]["title"] + "")) set_data_dev(t, t_value);

    			if (dirty & /*categories*/ 1 && button_class_value !== (button_class_value = "" + (null_to_empty(/*category*/ ctx[6]["enabled"] ? 'enabled' : 'disabled') + " svelte-1ozzfps"))) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(62:12) {#each categories as category}",
    		ctx
    	});

    	return block;
    }

    // (61:8) {#key rerender}
    function create_key_block(ctx) {
    	let each_1_anchor;
    	let each_value = /*categories*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*categories, handleClick*/ 9) {
    				each_value = /*categories*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_key_block.name,
    		type: "key",
    		source: "(61:8) {#key rerender}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let main;
    	let nav;
    	let t0;
    	let br;
    	let t1;
    	let div;
    	let previous_key = /*rerender*/ ctx[1];
    	let t2;
    	let button;
    	let current;
    	let mounted;
    	let dispose;

    	nav = new Nav({
    			props: { active: "home", scrollEffect: "false" },
    			$$inline: true
    		});

    	let key_block = create_key_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(nav.$$.fragment);
    			t0 = space();
    			br = element("br");
    			t1 = space();
    			div = element("div");
    			key_block.c();
    			t2 = space();
    			button = element("button");
    			button.textContent = "Defaults";
    			set_style(br, "font-size", "100px");
    			add_location(br, file$3, 58, 4, 1590);
    			attr_dev(button, "class", "default svelte-1ozzfps");
    			set_style(button, "color", "blue");
    			add_location(button, file$3, 68, 8, 1985);
    			attr_dev(div, "class", "content svelte-1ozzfps");
    			add_location(div, file$3, 59, 4, 1628);
    			attr_dev(main, "class", "svelte-1ozzfps");
    			add_location(main, file$3, 56, 0, 1534);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(nav, main, null);
    			append_dev(main, t0);
    			append_dev(main, br);
    			append_dev(main, t1);
    			append_dev(main, div);
    			key_block.m(div, null);
    			append_dev(div, t2);
    			append_dev(div, button);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*rerender*/ 2 && safe_not_equal(previous_key, previous_key = /*rerender*/ ctx[1])) {
    				key_block.d(1);
    				key_block = create_key_block(ctx);
    				key_block.c();
    				key_block.m(div, t2);
    			} else {
    				key_block.p(ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(nav.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(nav.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(nav);
    			key_block.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Settings', slots, []);
    	let rerender = false;
    	let defaultC = [];

    	axios({
    		method: 'get',
    		url: "/api/defaultHome",
    		responseType: 'json',
    		transformResponse: res => {
    			return JSON.parse(res);
    		}
    	}).then(response => {
    		$$invalidate(2, defaultC = response.data);
    	}).catch(error => {
    		console.log(error);
    	});

    	let categories = [];

    	axios({
    		method: 'get',
    		url: "/api/userInfo",
    		responseType: 'json',
    		transformResponse: res => {
    			return JSON.parse(res);
    		}
    	}).then(response => {
    		$$invalidate(0, categories = response.data["home"]);
    	}).catch(error => {
    		console.log(error);
    	});

    	const handleClick = title => {
    		for (var i = 0; i < categories.length; i++) {
    			if (categories[i]["title"] == title) {
    				if (categories[i]["enabled"] == true) $$invalidate(0, categories[i]["enabled"] = false, categories); else if (categories[i]["enabled"] == false) $$invalidate(0, categories[i]["enabled"] = true, categories);
    				break;
    			}
    		}

    		$$invalidate(1, rerender = !rerender);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$3.warn(`<Settings> was created with unknown prop '${key}'`);
    	});

    	const click_handler = category => {
    		handleClick(category["title"]);
    	};

    	const click_handler_1 = () => {
    		$$invalidate(0, categories = defaultC);
    	};

    	$$self.$capture_state = () => ({
    		Nav,
    		axios,
    		rerender,
    		defaultC,
    		categories,
    		handleClick
    	});

    	$$self.$inject_state = $$props => {
    		if ('rerender' in $$props) $$invalidate(1, rerender = $$props.rerender);
    		if ('defaultC' in $$props) $$invalidate(2, defaultC = $$props.defaultC);
    		if ('categories' in $$props) $$invalidate(0, categories = $$props.categories);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*categories*/ 1) {
    			{
    				if (categories != [] && categories != undefined) {
    					axios({
    						method: 'get',
    						url: "/api/updateHomeMenu?new=" + btoa(JSON.stringify(categories)),
    						responseType: 'json'
    					}).then(response => {
    						console.log(response.data);
    					}).catch(error => {
    						console.log(error);
    					});
    				}
    			}
    		}
    	};

    	return [categories, rerender, defaultC, handleClick, click_handler, click_handler_1];
    }

    class Settings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Settings",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\Addons.svelte generated by Svelte v3.49.0 */

    const { Object: Object_1$2, console: console_1$2 } = globals;
    const file$2 = "src\\Addons.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i][0];
    	child_ctx[5] = list[i][1];
    	return child_ctx;
    }

    // (41:8) {:catch error}
    function create_catch_block$2(ctx) {
    	let p;
    	let t0;
    	let t1_value = /*error*/ ctx[8].message + "";
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("Error: ");
    			t1 = text(t1_value);
    			set_style(p, "display", "none");
    			add_location(p, file$2, 41, 12, 1353);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$2.name,
    		type: "catch",
    		source: "(41:8) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (28:8) {:then resp}
    function create_then_block$2(ctx) {
    	let div;
    	let each_value = Object.entries(/*resp*/ ctx[3].data);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "grid-container svelte-1qawg92");
    			add_location(div, file$2, 28, 12, 792);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*window, Object, axios, JSON*/ 0) {
    				each_value = Object.entries(/*resp*/ ctx[3].data);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$2.name,
    		type: "then",
    		source: "(28:8) {:then resp}",
    		ctx
    	});

    	return block;
    }

    // (31:16) {#if d.open}
    function create_if_block$3(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let h4;
    	let b;
    	let t1_value = /*d*/ ctx[5].name + "";
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[1](/*d*/ ctx[5]);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			h4 = element("h4");
    			b = element("b");
    			t1 = text(t1_value);
    			t2 = space();
    			if (!src_url_equal(img.src, img_src_value = "/api/addonLogo/" + /*d*/ ctx[5].id)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Addon");
    			set_style(img, "width", "100%");
    			attr_dev(img, "class", "svelte-1qawg92");
    			add_location(img, file$2, 32, 24, 1023);
    			add_location(b, file$2, 34, 28, 1168);
    			attr_dev(h4, "class", "svelte-1qawg92");
    			add_location(h4, file$2, 34, 24, 1164);
    			attr_dev(div0, "class", "container svelte-1qawg92");
    			add_location(div0, file$2, 33, 24, 1115);
    			attr_dev(div1, "class", "grid-item card svelte-1qawg92");
    			add_location(div1, file$2, 31, 20, 929);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, h4);
    			append_dev(h4, b);
    			append_dev(b, t1);
    			append_dev(div1, t2);

    			if (!mounted) {
    				dispose = listen_dev(div1, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(31:16) {#if d.open}",
    		ctx
    	});

    	return block;
    }

    // (30:12) {#each Object.entries(resp.data) as [i, d]}
    function create_each_block$2(ctx) {
    	let if_block_anchor;
    	let if_block = /*d*/ ctx[5].open && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*d*/ ctx[5].open) if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(30:12) {#each Object.entries(resp.data) as [i, d]}",
    		ctx
    	});

    	return block;
    }

    // (26:122)               <p style="display: none;">Loading ...</p>          {:then resp}
    function create_pending_block$2(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Loading ...";
    			set_style(p, "display", "none");
    			add_location(p, file$2, 26, 12, 715);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$2.name,
    		type: "pending",
    		source: "(26:122)               <p style=\\\"display: none;\\\">Loading ...</p>          {:then resp}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let main;
    	let nav;
    	let t;
    	let div;
    	let current;

    	nav = new Nav({
    			props: { active: "addons", scrollEffect: "false" },
    			$$inline: true
    		});

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block$2,
    		then: create_then_block$2,
    		catch: create_catch_block$2,
    		value: 3,
    		error: 8
    	};

    	handle_promise(
    		axios.get("/api/addons", {
    			transformResponse: /*func*/ ctx[0],
    			responseType: 'json'
    		}),
    		info
    	);

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(nav.$$.fragment);
    			t = space();
    			div = element("div");
    			info.block.c();
    			attr_dev(div, "class", "content");
    			add_location(div, file$2, 24, 4, 556);
    			attr_dev(main, "class", "svelte-1qawg92");
    			add_location(main, file$2, 22, 0, 498);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(nav, main, null);
    			append_dev(main, t);
    			append_dev(main, div);
    			info.block.m(div, info.anchor = null);
    			info.mount = () => div;
    			info.anchor = null;
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			update_await_block_branch(info, ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(nav.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(nav.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(nav);
    			info.block.d();
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Addons', slots, []);
    	let addons = [];

    	axios({
    		method: 'get',
    		url: "/api/addons",
    		transformResponse: res => {
    			return JSON.parse(res);
    		},
    		responseType: 'json'
    	}).then(response => {
    		const data = response.data;

    		data.forEach(element => {
    			if (element.open) {
    				addons.push(element);
    			}
    		});
    	}).catch(error => {
    		console.log(error);
    	});

    	const writable_props = [];

    	Object_1$2.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$2.warn(`<Addons> was created with unknown prop '${key}'`);
    	});

    	const func = res => {
    		return JSON.parse(res);
    	};

    	const click_handler = d => {
    		window.location = d.open;
    	};

    	$$self.$capture_state = () => ({ Nav, axios, addons });

    	$$self.$inject_state = $$props => {
    		if ('addons' in $$props) addons = $$props.addons;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [func, click_handler];
    }

    class Addons extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Addons",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\Playlists.svelte generated by Svelte v3.49.0 */

    const { Object: Object_1$1, console: console_1$1 } = globals;
    const file$1 = "src\\Playlists.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[34] = list[i][0];
    	child_ctx[35] = list[i][1];
    	return child_ctx;
    }

    // (132:8) {:catch error}
    function create_catch_block$1(ctx) {
    	let p;
    	let t0;
    	let t1_value = /*error*/ ctx[38].message + "";
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("Error: ");
    			t1 = text(t1_value);
    			set_style(p, "display", "none");
    			add_location(p, file$1, 132, 12, 6852);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$1.name,
    		type: "catch",
    		source: "(132:8) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (29:8) {:then resp}
    function create_then_block$1(ctx) {
    	let div;
    	let each_value = Object.entries(/*resp*/ ctx[33].data);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "grid-container svelte-15lq60s");
    			add_location(div, file$1, 29, 12, 836);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*showOptions*/ 1) {
    				each_value = Object.entries(/*resp*/ ctx[33].data);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$1.name,
    		type: "then",
    		source: "(29:8) {:then resp}",
    		ctx
    	});

    	return block;
    }

    // (44:20) {#if showOptions}
    function create_if_block$2(ctx) {
    	let button0;
    	let t1;
    	let button1;
    	let t3;
    	let button2;
    	let t5;
    	let button3;
    	let mounted;
    	let dispose;

    	function mouseover_handler_1() {
    		return /*mouseover_handler_1*/ ctx[7](/*i*/ ctx[34]);
    	}

    	function focus_handler_1() {
    		return /*focus_handler_1*/ ctx[8](/*i*/ ctx[34]);
    	}

    	function mouseout_handler_1() {
    		return /*mouseout_handler_1*/ ctx[9](/*i*/ ctx[34]);
    	}

    	function blur_handler_1() {
    		return /*blur_handler_1*/ ctx[10](/*i*/ ctx[34]);
    	}

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[11](/*d*/ ctx[35]);
    	}

    	function mouseover_handler_2() {
    		return /*mouseover_handler_2*/ ctx[12](/*i*/ ctx[34]);
    	}

    	function focus_handler_2() {
    		return /*focus_handler_2*/ ctx[13](/*i*/ ctx[34]);
    	}

    	function mouseout_handler_2() {
    		return /*mouseout_handler_2*/ ctx[14](/*i*/ ctx[34]);
    	}

    	function blur_handler_2() {
    		return /*blur_handler_2*/ ctx[15](/*i*/ ctx[34]);
    	}

    	function click_handler_2(...args) {
    		return /*click_handler_2*/ ctx[16](/*d*/ ctx[35], ...args);
    	}

    	function mouseover_handler_3() {
    		return /*mouseover_handler_3*/ ctx[17](/*i*/ ctx[34]);
    	}

    	function focus_handler_3() {
    		return /*focus_handler_3*/ ctx[18](/*i*/ ctx[34]);
    	}

    	function mouseout_handler_3() {
    		return /*mouseout_handler_3*/ ctx[19](/*i*/ ctx[34]);
    	}

    	function blur_handler_3() {
    		return /*blur_handler_3*/ ctx[20](/*i*/ ctx[34]);
    	}

    	function click_handler_3() {
    		return /*click_handler_3*/ ctx[21](/*d*/ ctx[35]);
    	}

    	function mouseover_handler_4() {
    		return /*mouseover_handler_4*/ ctx[22](/*i*/ ctx[34]);
    	}

    	function focus_handler_4() {
    		return /*focus_handler_4*/ ctx[23](/*i*/ ctx[34]);
    	}

    	function mouseout_handler_4() {
    		return /*mouseout_handler_4*/ ctx[24](/*i*/ ctx[34]);
    	}

    	function blur_handler_4() {
    		return /*blur_handler_4*/ ctx[25](/*i*/ ctx[34]);
    	}

    	function click_handler_4() {
    		return /*click_handler_4*/ ctx[26](/*d*/ ctx[35]);
    	}

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			button0.textContent = "Change Icon";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "Share";
    			t3 = space();
    			button2 = element("button");
    			button2.textContent = "Rename";
    			t5 = space();
    			button3 = element("button");
    			button3.textContent = "Delete";
    			attr_dev(button0, "class", "svelte-15lq60s");
    			add_location(button0, file$1, 44, 20, 1660);
    			attr_dev(button1, "class", "svelte-15lq60s");
    			add_location(button1, file$1, 64, 20, 2818);
    			attr_dev(button2, "class", "svelte-15lq60s");
    			add_location(button2, file$1, 79, 20, 3699);
    			attr_dev(button3, "class", "svelte-15lq60s");
    			add_location(button3, file$1, 99, 20, 4853);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, button2, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, button3, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "mouseover", mouseover_handler_1, false, false, false),
    					listen_dev(button0, "focus", focus_handler_1, false, false, false),
    					listen_dev(button0, "mouseout", mouseout_handler_1, false, false, false),
    					listen_dev(button0, "blur", blur_handler_1, false, false, false),
    					listen_dev(button0, "click", click_handler_1, false, false, false),
    					listen_dev(button1, "mouseover", mouseover_handler_2, false, false, false),
    					listen_dev(button1, "focus", focus_handler_2, false, false, false),
    					listen_dev(button1, "mouseout", mouseout_handler_2, false, false, false),
    					listen_dev(button1, "blur", blur_handler_2, false, false, false),
    					listen_dev(button1, "click", click_handler_2, false, false, false),
    					listen_dev(button2, "mouseover", mouseover_handler_3, false, false, false),
    					listen_dev(button2, "focus", focus_handler_3, false, false, false),
    					listen_dev(button2, "mouseout", mouseout_handler_3, false, false, false),
    					listen_dev(button2, "blur", blur_handler_3, false, false, false),
    					listen_dev(button2, "click", click_handler_3, false, false, false),
    					listen_dev(button3, "mouseover", mouseover_handler_4, false, false, false),
    					listen_dev(button3, "focus", focus_handler_4, false, false, false),
    					listen_dev(button3, "mouseout", mouseout_handler_4, false, false, false),
    					listen_dev(button3, "blur", blur_handler_4, false, false, false),
    					listen_dev(button3, "click", click_handler_4, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(button2);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(button3);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(44:20) {#if showOptions}",
    		ctx
    	});

    	return block;
    }

    // (31:12) {#each Object.entries(resp.data) as [i, d]}
    function create_each_block$1(ctx) {
    	let div2;
    	let button;
    	let t0;
    	let t1_value = (/*showOptions*/ ctx[0] ? '???' : '???') + "";
    	let t1;
    	let t2;
    	let t3;
    	let div1;
    	let img;
    	let img_src_value;
    	let t4;
    	let div0;
    	let h4;
    	let b;
    	let t5_value = /*d*/ ctx[35].title + "";
    	let t5;
    	let t6;
    	let mounted;
    	let dispose;

    	function mouseover_handler() {
    		return /*mouseover_handler*/ ctx[2](/*i*/ ctx[34]);
    	}

    	function focus_handler() {
    		return /*focus_handler*/ ctx[3](/*i*/ ctx[34]);
    	}

    	function mouseout_handler() {
    		return /*mouseout_handler*/ ctx[4](/*i*/ ctx[34]);
    	}

    	function blur_handler() {
    		return /*blur_handler*/ ctx[5](/*i*/ ctx[34]);
    	}

    	let if_block = /*showOptions*/ ctx[0] && create_if_block$2(ctx);

    	function click_handler_5() {
    		return /*click_handler_5*/ ctx[27](/*d*/ ctx[35]);
    	}

    	function mouseover_handler_5() {
    		return /*mouseover_handler_5*/ ctx[28](/*i*/ ctx[34]);
    	}

    	function focus_handler_5() {
    		return /*focus_handler_5*/ ctx[29](/*i*/ ctx[34]);
    	}

    	function mouseout_handler_5() {
    		return /*mouseout_handler_5*/ ctx[30](/*i*/ ctx[34]);
    	}

    	function blur_handler_5() {
    		return /*blur_handler_5*/ ctx[31](/*i*/ ctx[34]);
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			button = element("button");
    			t0 = text("Options ");
    			t1 = text(t1_value);
    			t2 = space();
    			if (if_block) if_block.c();
    			t3 = space();
    			div1 = element("div");
    			img = element("img");
    			t4 = space();
    			div0 = element("div");
    			h4 = element("h4");
    			b = element("b");
    			t5 = text(t5_value);
    			t6 = space();
    			attr_dev(button, "class", "svelte-15lq60s");
    			add_location(button, file$1, 32, 20, 998);
    			if (!src_url_equal(img.src, img_src_value = "https://corsproxy.io/?" + encodeURIComponent(/*d*/ ctx[35].logo))) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Playlist");
    			set_style(img, "width", "100%");
    			attr_dev(img, "class", "svelte-15lq60s");
    			add_location(img, file$1, 123, 24, 6486);
    			add_location(b, file$1, 125, 32, 6665);
    			attr_dev(h4, "class", "svelte-15lq60s");
    			add_location(h4, file$1, 125, 28, 6661);
    			attr_dev(div0, "class", "container svelte-15lq60s");
    			add_location(div0, file$1, 124, 24, 6608);
    			add_location(div1, file$1, 116, 20, 5911);
    			attr_dev(div2, "class", "grid-item card svelte-15lq60s");
    			attr_dev(div2, "id", /*i*/ ctx[34]);
    			add_location(div2, file$1, 31, 16, 939);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, button);
    			append_dev(button, t0);
    			append_dev(button, t1);
    			append_dev(div2, t2);
    			if (if_block) if_block.m(div2, null);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			append_dev(div1, img);
    			append_dev(div1, t4);
    			append_dev(div1, div0);
    			append_dev(div0, h4);
    			append_dev(h4, b);
    			append_dev(b, t5);
    			append_dev(div2, t6);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "mouseover", mouseover_handler, false, false, false),
    					listen_dev(button, "focus", focus_handler, false, false, false),
    					listen_dev(button, "mouseout", mouseout_handler, false, false, false),
    					listen_dev(button, "blur", blur_handler, false, false, false),
    					listen_dev(button, "click", /*click_handler*/ ctx[6], false, false, false),
    					listen_dev(div1, "click", click_handler_5, false, false, false),
    					listen_dev(div1, "mouseover", mouseover_handler_5, false, false, false),
    					listen_dev(div1, "focus", focus_handler_5, false, false, false),
    					listen_dev(div1, "mouseout", mouseout_handler_5, false, false, false),
    					listen_dev(div1, "blur", blur_handler_5, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*showOptions*/ 1 && t1_value !== (t1_value = (/*showOptions*/ ctx[0] ? '???' : '???') + "")) set_data_dev(t1, t1_value);

    			if (/*showOptions*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(div2, t3);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(31:12) {#each Object.entries(resp.data) as [i, d]}",
    		ctx
    	});

    	return block;
    }

    // (27:133)               <p style="display: none;">Loading ...</p>          {:then resp}
    function create_pending_block$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Loading ...";
    			set_style(p, "display", "none");
    			add_location(p, file$1, 27, 12, 759);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$1.name,
    		type: "pending",
    		source: "(27:133)               <p style=\\\"display: none;\\\">Loading ...</p>          {:then resp}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let main;
    	let nav;
    	let t;
    	let div;
    	let current;

    	nav = new Nav({
    			props: {
    				active: "playlists",
    				scrollEffect: "false"
    			},
    			$$inline: true
    		});

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block$1,
    		then: create_then_block$1,
    		catch: create_catch_block$1,
    		value: 33,
    		error: 38
    	};

    	handle_promise(
    		axios.get("/api/playlists", {
    			transformResponse: /*func*/ ctx[1],
    			responseType: 'json'
    		}),
    		info
    	);

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(nav.$$.fragment);
    			t = space();
    			div = element("div");
    			info.block.c();
    			attr_dev(div, "class", "content");
    			add_location(div, file$1, 25, 4, 589);
    			attr_dev(main, "class", "svelte-15lq60s");
    			add_location(main, file$1, 23, 0, 528);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(nav, main, null);
    			append_dev(main, t);
    			append_dev(main, div);
    			info.block.m(div, info.anchor = null);
    			info.mount = () => div;
    			info.anchor = null;
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			update_await_block_branch(info, ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(nav.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(nav.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(nav);
    			info.block.d();
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Playlists', slots, []);
    	var showOptions = false;
    	let addons = [];

    	axios({
    		method: 'get',
    		url: "/api/addons",
    		transformResponse: res => {
    			return JSON.parse(res);
    		},
    		responseType: 'json'
    	}).then(response => {
    		const data = response.data;

    		data.forEach(element => {
    			if (element.open) {
    				addons.push(element);
    			}
    		});
    	}).catch(error => {
    		console.log(error);
    	});

    	const writable_props = [];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Playlists> was created with unknown prop '${key}'`);
    	});

    	const func = res => {
    		return JSON.parse(res).results;
    	};

    	const mouseover_handler = i => {
    		document.getElementById(i.toString()).style.borderColor = 'blue';
    	};

    	const focus_handler = i => {
    		document.getElementById(i.toString()).style.borderColor = 'blue';
    	};

    	const mouseout_handler = i => {
    		document.getElementById(i.toString()).style.borderColor = 'blue';
    	};

    	const blur_handler = i => {
    		document.getElementById(i.toString()).style.borderColor = 'blue';
    	};

    	const click_handler = () => {
    		$$invalidate(0, showOptions = !showOptions);
    	};

    	const mouseover_handler_1 = i => {
    		document.getElementById(i.toString()).style.borderColor = 'blue';
    	};

    	const focus_handler_1 = i => {
    		document.getElementById(i.toString()).style.borderColor = 'blue';
    	};

    	const mouseout_handler_1 = i => {
    		document.getElementById(i.toString()).style.borderColor = 'blue';
    	};

    	const blur_handler_1 = i => {
    		document.getElementById(i.toString()).style.borderColor = 'blue';
    	};

    	const click_handler_1 = d => {
    		let newImage = prompt("Enter image URL:", "");

    		if (newImage == null || newImage == "") {
    			return;
    		}

    		let xhr = new XMLHttpRequest();
    		xhr.open("GET", `/api/changeIcon?image=${newImage}&playlistID=${d.playlistID}`, true);

    		xhr.onreadystatechange = function () {
    			if (xhr.readyState == 4 && xhr.status == 200) {
    				window.location.reload();
    			}
    		};

    		xhr.send();
    	};

    	const mouseover_handler_2 = i => {
    		document.getElementById(i.toString()).style.borderColor = 'blue';
    	};

    	const focus_handler_2 = i => {
    		document.getElementById(i.toString()).style.borderColor = 'blue';
    	};

    	const mouseout_handler_2 = i => {
    		document.getElementById(i.toString()).style.borderColor = 'blue';
    	};

    	const blur_handler_2 = i => {
    		document.getElementById(i.toString()).style.borderColor = 'blue';
    	};

    	const click_handler_2 = (d, e) => {
    		navigator.clipboard.writeText(`${window.location.origin}?tab=playlist&id=${d.playlistID}`);
    		e.originalTarget.innerText = "Copied";

    		window.setTimeout(
    			function () {
    				e.originalTarget.innerText = "Share";
    			},
    			1000
    		);
    	};

    	const mouseover_handler_3 = i => {
    		document.getElementById(i.toString()).style.borderColor = 'blue';
    	};

    	const focus_handler_3 = i => {
    		document.getElementById(i.toString()).style.borderColor = 'blue';
    	};

    	const mouseout_handler_3 = i => {
    		document.getElementById(i.toString()).style.borderColor = 'blue';
    	};

    	const blur_handler_3 = i => {
    		document.getElementById(i.toString()).style.borderColor = 'blue';
    	};

    	const click_handler_3 = d => {
    		let newTitle = prompt("Change title:", "");

    		if (newTitle == null || newTitle == "") {
    			return;
    		}

    		let xhr = new XMLHttpRequest();
    		xhr.open("GET", `/api/renamePlaylist?title=${newTitle}&playlistID=${d.playlistID}`, true);

    		xhr.onreadystatechange = function () {
    			if (xhr.readyState == 4 && xhr.status == 200) {
    				window.location.reload();
    			}
    		};

    		xhr.send();
    	};

    	const mouseover_handler_4 = i => {
    		document.getElementById(i.toString()).style.borderColor = 'blue';
    	};

    	const focus_handler_4 = i => {
    		document.getElementById(i.toString()).style.borderColor = 'blue';
    	};

    	const mouseout_handler_4 = i => {
    		document.getElementById(i.toString()).style.borderColor = 'blue';
    	};

    	const blur_handler_4 = i => {
    		document.getElementById(i.toString()).style.borderColor = 'blue';
    	};

    	const click_handler_4 = d => {
    		let xhr = new XMLHttpRequest();
    		xhr.open("GET", `/api/deletePlaylist/${d.playlistID}`, true);

    		xhr.onreadystatechange = function () {
    			if (xhr.readyState == 4 && xhr.status == 200) {
    				window.location.reload();
    			}
    		};

    		xhr.send();
    	};

    	const click_handler_5 = d => {
    		window.location = `/?tab=playlist&id=${d.playlistID}`;
    	};

    	const mouseover_handler_5 = i => {
    		document.getElementById(i.toString()).style.borderColor = 'beige';
    	};

    	const focus_handler_5 = i => {
    		document.getElementById(i.toString()).style.borderColor = 'beige';
    	};

    	const mouseout_handler_5 = i => {
    		document.getElementById(i.toString()).style.borderColor = 'blue';
    	};

    	const blur_handler_5 = i => {
    		document.getElementById(i.toString()).style.borderColor = 'blue';
    	};

    	$$self.$capture_state = () => ({ Nav, axios, showOptions, addons });

    	$$self.$inject_state = $$props => {
    		if ('showOptions' in $$props) $$invalidate(0, showOptions = $$props.showOptions);
    		if ('addons' in $$props) addons = $$props.addons;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		showOptions,
    		func,
    		mouseover_handler,
    		focus_handler,
    		mouseout_handler,
    		blur_handler,
    		click_handler,
    		mouseover_handler_1,
    		focus_handler_1,
    		mouseout_handler_1,
    		blur_handler_1,
    		click_handler_1,
    		mouseover_handler_2,
    		focus_handler_2,
    		mouseout_handler_2,
    		blur_handler_2,
    		click_handler_2,
    		mouseover_handler_3,
    		focus_handler_3,
    		mouseout_handler_3,
    		blur_handler_3,
    		click_handler_3,
    		mouseover_handler_4,
    		focus_handler_4,
    		mouseout_handler_4,
    		blur_handler_4,
    		click_handler_4,
    		click_handler_5,
    		mouseover_handler_5,
    		focus_handler_5,
    		mouseout_handler_5,
    		blur_handler_5
    	];
    }

    class Playlists extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {}, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Playlists",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\Playlist.svelte generated by Svelte v3.49.0 */

    const { Object: Object_1, console: console_1 } = globals;
    const file = "src\\Playlist.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i][0];
    	child_ctx[11] = list[i][1];
    	return child_ctx;
    }

    // (70:8) {:catch error}
    function create_catch_block(ctx) {
    	let p;
    	let t0;
    	let t1_value = /*error*/ ctx[14].message + "";
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("Error: ");
    			t1 = text(t1_value);
    			set_style(p, "display", "none");
    			add_location(p, file, 70, 12, 2647);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(70:8) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (42:8) {:then resp}
    function create_then_block(ctx) {
    	let div;
    	let each_value = Object.entries(/*resp*/ ctx[9].data.items);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "grid-container svelte-1vn6sxo");
    			add_location(div, file, 42, 12, 1108);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*window, Object, axios, id, JSON, document, XMLHttpRequest, UID*/ 1) {
    				each_value = Object.entries(/*resp*/ ctx[9].data.items);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(42:8) {:then resp}",
    		ctx
    	});

    	return block;
    }

    // (46:20) {#if resp.data.owners.includes(UID)}
    function create_if_block$1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	function mouseover_handler() {
    		return /*mouseover_handler*/ ctx[2](/*i*/ ctx[10]);
    	}

    	function focus_handler() {
    		return /*focus_handler*/ ctx[3](/*i*/ ctx[10]);
    	}

    	function mouseout_handler() {
    		return /*mouseout_handler*/ ctx[4](/*i*/ ctx[10]);
    	}

    	function blur_handler() {
    		return /*blur_handler*/ ctx[5](/*i*/ ctx[10]);
    	}

    	function click_handler() {
    		return /*click_handler*/ ctx[6](/*d*/ ctx[11]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Remove";
    			attr_dev(button, "class", "svelte-1vn6sxo");
    			add_location(button, file, 46, 20, 1325);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "mouseover", mouseover_handler, false, false, false),
    					listen_dev(button, "focus", focus_handler, false, false, false),
    					listen_dev(button, "mouseout", mouseout_handler, false, false, false),
    					listen_dev(button, "blur", blur_handler, false, false, false),
    					listen_dev(button, "click", click_handler, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(46:20) {#if resp.data.owners.includes(UID)}",
    		ctx
    	});

    	return block;
    }

    // (44:12) {#each Object.entries(resp.data.items) as [i, d]}
    function create_each_block(ctx) {
    	let div1;
    	let show_if = /*resp*/ ctx[9].data.owners.includes(/*UID*/ ctx[0]);
    	let t0;
    	let div0;
    	let img;
    	let img_src_value;
    	let t1;
    	let mounted;
    	let dispose;
    	let if_block = show_if && create_if_block$1(ctx);

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[7](/*d*/ ctx[11]);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			div0 = element("div");
    			img = element("img");
    			t1 = space();
    			if (!src_url_equal(img.src, img_src_value = "/api/poster/" + /*d*/ ctx[11].id + "?do=show")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Movie");
    			set_style(img, "width", "100%");
    			attr_dev(img, "class", "svelte-1vn6sxo");
    			add_location(img, file, 64, 24, 2444);
    			attr_dev(div0, "class", "container svelte-1vn6sxo");
    			add_location(div0, file, 63, 20, 2329);
    			attr_dev(div1, "class", "grid-item card svelte-1vn6sxo");
    			add_location(div1, file, 44, 16, 1217);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			if (if_block) if_block.m(div1, null);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, img);
    			append_dev(div1, t1);

    			if (!mounted) {
    				dispose = listen_dev(div0, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*UID*/ 1) show_if = /*resp*/ ctx[9].data.owners.includes(/*UID*/ ctx[0]);

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(div1, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(44:12) {#each Object.entries(resp.data.items) as [i, d]}",
    		ctx
    	});

    	return block;
    }

    // (40:138)               <p style="display: none;">Loading ...</p>          {:then resp}
    function create_pending_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Loading ...";
    			set_style(p, "display", "none");
    			add_location(p, file, 40, 12, 1031);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(40:138)               <p style=\\\"display: none;\\\">Loading ...</p>          {:then resp}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let main;
    	let nav;
    	let t;
    	let div;
    	let current;

    	nav = new Nav({
    			props: {
    				active: "playlists",
    				scrollEffect: "false"
    			},
    			$$inline: true
    		});

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 9,
    		error: 14
    	};

    	handle_promise(
    		axios.get(`/api/playlist/${id}`, {
    			transformResponse: /*func*/ ctx[1],
    			responseType: 'json'
    		}),
    		info
    	);

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(nav.$$.fragment);
    			t = space();
    			div = element("div");
    			info.block.c();
    			attr_dev(div, "class", "content");
    			add_location(div, file, 38, 4, 856);
    			attr_dev(main, "class", "svelte-1vn6sxo");
    			add_location(main, file, 36, 0, 795);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(nav, main, null);
    			append_dev(main, t);
    			append_dev(main, div);
    			info.block.m(div, info.anchor = null);
    			info.mount = () => div;
    			info.anchor = null;
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			update_await_block_branch(info, ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(nav.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(nav.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(nav);
    			info.block.d();
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Playlist', slots, []);
    	let addons = [];
    	var UID = "";

    	axios({
    		method: 'get',
    		url: "/api/addons",
    		transformResponse: res => {
    			return JSON.parse(res);
    		},
    		responseType: 'json'
    	}).then(response => {
    		const data = response.data;

    		data.forEach(element => {
    			if (element.open) {
    				addons.push(element);
    			}
    		});
    	}).catch(error => {
    		console.log(error);
    	});

    	axios({
    		method: 'get',
    		url: "/api/userInfo",
    		transformResponse: res => {
    			return JSON.parse(res);
    		},
    		responseType: 'json'
    	}).then(response => {
    		const data = response.data;
    		$$invalidate(0, UID = data.UID);
    	}).catch(error => {
    		console.log(error);
    	});

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Playlist> was created with unknown prop '${key}'`);
    	});

    	const func = res => {
    		return JSON.parse(res).results;
    	};

    	const mouseover_handler = i => {
    		document.getElementById(i.toString()).style.borderColor = 'blue';
    	};

    	const focus_handler = i => {
    		document.getElementById(i.toString()).style.borderColor = 'blue';
    	};

    	const mouseout_handler = i => {
    		document.getElementById(i.toString()).style.borderColor = 'blue';
    	};

    	const blur_handler = i => {
    		document.getElementById(i.toString()).style.borderColor = 'blue';
    	};

    	const click_handler = d => {
    		let xhr = new XMLHttpRequest();
    		xhr.open("GET", `/api/removeFromPlaylist/${id}/${d.id}`, true);

    		xhr.onreadystatechange = function () {
    			if (xhr.readyState == 4 && xhr.status == 200) {
    				window.location.reload();
    			}
    		};

    		xhr.send();
    	};

    	const click_handler_1 = d => {
    		window.location = `/watch/${d.id}/?kind=${d.kind}`;
    	};

    	$$self.$capture_state = () => ({ Nav, axios, addons, UID });

    	$$self.$inject_state = $$props => {
    		if ('addons' in $$props) addons = $$props.addons;
    		if ('UID' in $$props) $$invalidate(0, UID = $$props.UID);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		UID,
    		func,
    		mouseover_handler,
    		focus_handler,
    		mouseout_handler,
    		blur_handler,
    		click_handler,
    		click_handler_1
    	];
    }

    class Playlist extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Playlist",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.49.0 */

    // (24:0) {:else}
    function create_else_block(ctx) {
    	let home;
    	let current;

    	home = new Home({
    			props: { id, showG, showFt },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(home.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(home, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(home.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(home.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(home, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(24:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (22:28) 
    function create_if_block_5(ctx) {
    	let settings;
    	let current;
    	settings = new Settings({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(settings.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(settings, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(settings.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(settings.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(settings, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(22:28) ",
    		ctx
    	});

    	return block;
    }

    // (20:26) 
    function create_if_block_4(ctx) {
    	let addons;
    	let current;
    	addons = new Addons({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(addons.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(addons, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(addons.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(addons.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(addons, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(20:26) ",
    		ctx
    	});

    	return block;
    }

    // (18:28) 
    function create_if_block_3(ctx) {
    	let playlist;
    	let current;
    	playlist = new Playlist({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(playlist.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(playlist, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(playlist.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(playlist.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(playlist, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(18:28) ",
    		ctx
    	});

    	return block;
    }

    // (16:29) 
    function create_if_block_2(ctx) {
    	let playlists;
    	let current;
    	playlists = new Playlists({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(playlists.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(playlists, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(playlists.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(playlists.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(playlists, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(16:29) ",
    		ctx
    	});

    	return block;
    }

    // (14:29) 
    function create_if_block_1(ctx) {
    	let favorites;
    	let current;
    	favorites = new Favorites({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(favorites.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(favorites, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(favorites.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(favorites.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(favorites, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(14:29) ",
    		ctx
    	});

    	return block;
    }

    // (12:0) {#if tab == "search"}
    function create_if_block(ctx) {
    	let search;
    	let current;
    	search = new Search({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(search.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(search, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(search.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(search.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(search, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(12:0) {#if tab == \\\"search\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;

    	const if_block_creators = [
    		create_if_block,
    		create_if_block_1,
    		create_if_block_2,
    		create_if_block_3,
    		create_if_block_4,
    		create_if_block_5,
    		create_else_block
    	];

    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (tab == "search") return 0;
    		if (tab == "favorites") return 1;
    		if (tab == "playlists") return 2;
    		if (tab == "playlist") return 3;
    		if (tab == "addons") return 4;
    		if (tab == "settings") return 5;
    		return 6;
    	}

    	current_block_type_index = select_block_type();
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if_block.p(ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Home,
    		Favorites,
    		Search,
    		Settings,
    		Addons,
    		Playlists,
    		Playlist
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
