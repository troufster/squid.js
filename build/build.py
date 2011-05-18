import os
import tempfile
import sys

FILES = [
'framework.js',
'vector.js',
'hashmap.js',
'shape.js',
'tools/common.js',
'tools/pencil.js',
'tools/single.js',
'tools/freehand.js',
'prototypes.js',
'squid.js'
]

def merge(files):
    buffer = []

    for filename in files:
        with open(os.path.join('..', 'src', filename), 'r') as f:
            buffer.append(f.read())
    return "".join(buffer)

def output(text, filename):

    with open(os.path.join('..', filename), 'w') as f:
        f.write(text)

def compress(text):

    in_tuple = tempfile.mkstemp()
    with os.fdopen(in_tuple[0], 'w') as handle:
        handle.write(text)

    out_tuple = tempfile.mkstemp()
    os.system("java -jar compiler.jar --compilation_level SIMPLE_OPTIMIZATIONS --language_in=ECMASCRIPT5 --js %s --js_output_file %s" % (in_tuple[1], out_tuple[1]))

    with os.fdopen(out_tuple[0], 'r') as handle:
        compressed = handle.read();

    os.unlink(in_tuple[1]);
    os.unlink(out_tuple[1]);

    return compressed

def build(files):
    text = merge(files)
    uctext = text
    print "*" * 40
    print "Compiling..."
    print "*" * 40

    text = compress(text)
    output(text, "squid.min.js")
    output(uctext, "squid.js")

def main(argv=None):
    build(FILES)

if __name__ == "__main__":
    main()
