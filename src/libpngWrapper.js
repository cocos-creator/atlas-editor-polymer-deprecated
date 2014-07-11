/* 
 * wrap the libpng javascript codes compiled by Emscripten
 * references: https://github.com/kripken/emscripten/wiki/Interacting-with-code
 *             http://www.libpng.org/pub/png/libpng-manual.txt
 *             http://www.w3.org/TR/PNG/
 */

// setup global module parameters
var Module = {
	'noInitialRun' : true,
	'noFSInit' : true,
    'print': console.log,
    'printErr': console.error,
};

// C definitions
var NULL = 0;

var libpng = function () {
    var init = function () {
        init = function () {};  // just init once

        // emscripten definitions
        var I32_SIZE = 4;
        var PTR_SIZE = 4;
        
        // argument types
        var S = 'string';       // char*
        var N = 'number';       // int, float... etc
        var P = 'number';       // pointer
        var V = 'undefined';    // void

        // libpng definitions
        var PNG_LIBPNG_VER_STRING = "1.5.10";
        var PNG_COMPRESSION_TYPE_BASE = 0; /* Deflate method 8, 32K window */
        var PNG_INTERLACE_NONE = 0; /* Non-interlaced image */
        //var PNG_INTERLACE_ADAM7 = 1; /* Adam7 interlacing */
        var PNG_FILTER_TYPE_BASE = 0; /* Single row per-byte filtering */
        var PNG_INTRAPIXEL_DIFFERENCING = 64; /* Used only in MNG datastreams */
        var PNG_COLOR_TYPE_RGB_ALPHA = 6;

        function checkPtr (ptr, errorInfo) {
            if (!ptr) {
                console.error(errorInfo);
            }
        }
        //function simpleDefine(functionName, resultType, argumentTypeList) {
        //    var func = Module.cwrap(functionName, resultType, argumentTypeList);
        //    libpng[functionName.slice('png_'.length, 50)] = func;
        //}
        function mallocPtr(value) {
            var ptr = Module._malloc(PTR_SIZE);
            setValue(ptr, value, 'i32');
            return ptr;
        }
        function freePtr(ptr) {
            Module._free(ptr);
        }
        var cwrap = Module.cwrap;

        // declare and get wrapped c function
        var create_write_struct = cwrap('png_create_write_struct_2', P, [S, P, P, P]);
        var create_info_struct = cwrap('png_create_info_struct', P, [P]);
        var set_write_fn = cwrap('png_set_write_fn', V, [P, P, P, P]);
        //libpng.get_io_ptr = cwrap('png_get_io_ptr', P, [P]);
        var set_IHDR = cwrap('png_set_IHDR', V, [P, P, N, N, N, N, N, N, N]);
        libpng.write_info = cwrap('png_write_info', V, [P, P]);
        libpng.write_image = cwrap('png_write_image', V, [P, P]);
        libpng.write_row = cwrap('png_write_row', V, [P, P]);
        libpng.write_end = cwrap('png_write_end', V, [P, P]);
        destroy_read_struct = cwrap('png_destroy_read_struct', V, [P, P, P]);
        destroy_write_struct = cwrap('png_destroy_write_struct', V, [P, P]);
        //libpng.free_data = cwrap('png_free_data', V, [P, P, N, N]);
        libpng.set_filter = cwrap('png_set_filter', V, [P, N, N]);
        libpng.set_compression_level = cwrap('png_set_compression_level', V, [P, N]);

        // exports
        libpng.create_write_struct = function () {
            var png_ptr = create_write_struct(PNG_LIBPNG_VER_STRING, NULL, NULL, NULL);
            checkPtr(png_ptr, "create_write_struct failed");
            return png_ptr;
        };
        libpng.create_info_struct = function (png_ptr) {
            var info_ptr = create_info_struct(png_ptr);
            checkPtr(info_ptr, "create_info_struct failed");
            return info_ptr;
        };
        libpng.set_write_fn = function (png_ptr, write_data_fn) {
            //var flush_data_fn = Runtime.addFunction( function () {} );
            set_write_fn(png_ptr, NULL, Runtime.addFunction(write_data_fn), NULL);
        };
        libpng.set_IHDR = function (png_ptr, info_ptr, width, height, bitDepth, colorType, interlace, compression, filter) {
            bitDepth = typeof bitDepth !== 'undefined' ? bitDepth : 8;
            colorType = typeof colorType !== 'undefined' ? colorType : PNG_COLOR_TYPE_RGB_ALPHA;
            interlace = typeof interlace !== 'undefined' ? interlace : PNG_INTERLACE_NONE;
            compression = typeof compression !== 'undefined' ? compression : PNG_COMPRESSION_TYPE_BASE;
            filter = typeof filter !== 'undefined' ? filter : PNG_FILTER_TYPE_BASE;
            set_IHDR(png_ptr, info_ptr, width, height, bitDepth, colorType, interlace, compression, filter);
        };
        libpng.destroy_read_struct = function (png_ptr, info_ptr, end_info_ptr) {
            var png_ptr_ptr = mallocPtr(png_ptr);
            var info_ptr_ptr = mallocPtr(info_ptr);
            var end_info_ptr_ptr = mallocPtr(end_info_ptr);

            destroy_read_struct(png_ptr_ptr, info_ptr_ptr, end_info_ptr_ptr);

            freePtr(png_ptr_ptr);
            freePtr(info_ptr_ptr);
            freePtr(end_info_ptr_ptr);
        };
        libpng.destroy_write_struct = function (png_ptr, info_ptr) {
            var png_ptr_ptr = mallocPtr(png_ptr);
            var info_ptr_ptr = mallocPtr(info_ptr);

            destroy_write_struct(png_ptr_ptr, info_ptr_ptr);

            freePtr(png_ptr_ptr);
            freePtr(info_ptr_ptr);
        };
    };

    var png = function (width, height) {
        this.width = width;
        this.height = height;
        this.png_ptr = libpng.create_write_struct();
        this.info_ptr = libpng.create_info_struct(this.png_ptr);
        this.data = [];
                
        var selfData = this.data;
        libpng.set_write_fn(this.png_ptr, function (png_ptr, data, length) {
            for (var i = 0, int32 = 0, uint8 = 0; i < length; i++) {
                int32 = getValue(data + i, 'i8');
                uint8 = int32 & 0x000000FF;
                selfData.push(uint8);
            }
        });

        // write IHDR
        libpng.set_IHDR(this.png_ptr, this.info_ptr, width, height);
        libpng.write_info(this.png_ptr, this.info_ptr);
    };

    png.prototype.write_image = function (row_pointers) {
        libpng.write_image(this.png_ptr, row_pointers);
    };
    
    png.prototype.write_imageData = function (imageData) {
        if (Array.isArray(imageData)) {
            imageData = new Uint8Array(imageData);
        }
        var png_ptr = this.png_ptr;
        var width = this.width;
        var height = this.height;
        var write_row = libpng.write_row;
        var BYTES_PER_PIXEL = 4;
        var ditch = this.width * BYTES_PER_PIXEL;

        var row_ptr = Module._malloc(ditch);

        for (var start = 0, end = ditch * height; start < end; start += ditch) {
            // copy image data to its heap
            Module.HEAPU8.set(imageData.subarray(start, start + ditch), row_ptr);
            // call write
            write_row(png_ptr, row_ptr);
        }

        Module._free(row_ptr);
    };

    png.prototype.write_end = function () {
        libpng.write_end(this.png_ptr, NULL);
        libpng.destroy_write_struct(this.png_ptr, this.info_ptr);
        //var PNG_FREE_ALL = 0x7fff;
        //libpng.free_data(this.png_ptr, this.info_ptr, PNG_FREE_ALL, -1);
        this.png_ptr = NULL;
        this.info_ptr = NULL;
    };

    png.prototype.set_filter = function (filters) {
        libpng.set_filter(this.png_ptr, 0, filters);
    };

    png.prototype.set_compression_level = function (level) {
        libpng.set_compression_level(this.png_ptr, level);
    };
    
    // output a PNG string, base64 encoded
    png.prototype.encode_base64 = function () {
        var s = this.data;
        var ch = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var c1, c2, c3, e1, e2, e3, e4;
        var l = s.length;
        var i = 0;
        var r = "";
        do {
            c1 = s[i];
            e1 = c1 >> 2;
            c2 = s[i + 1];
            e2 = ((c1 & 3) << 4) | (c2 >> 4);
            c3 = s[i + 2];
            if (l < i + 2) { e3 = 64; } else { e3 = ((c2 & 0xf) << 2) | (c3 >> 6); }
            if (l < i + 3) { e4 = 64; } else { e4 = c3 & 0x3f; }
            r += ch.charAt(e1) + ch.charAt(e2) + ch.charAt(e3) + ch.charAt(e4);
        } while ((i += 3) < l);
        return r;
    };

    // the low-level interface
    var libpng = {

        FILTER_NONE:  0x08,
        FILTER_SUB:   0x10,
        FILTER_UP:    0x20,
        FILTER_AVG:   0x40,
        FILTER_PAETH: 0x80,
        ALL_FILTERS: 0x08 | 0x10 | 0x20 | 0x40 | 0x80,

        init: init,
        // init and create a high-level interface for encoding
        createWriter: function (width, height) {
            init();
            return new png(width, height);
        },
    };

    return libpng;
}();