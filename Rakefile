require 'rake'

PROTO_NAME = 'proto'
PROTO_VERSION = '0.1'

PROTO_ROOT = File.expand_path(File.dirname(__FILE__))
PROTO_SRC_DIR = File.join(PROTO_ROOT, 'src')
PROTO_DIST_DIR = File.join(PROTO_ROOT, 'dist')

PROTO_DIST_FILE = File.join(PROTO_DIST_DIR, "#{PROTO_NAME}.js")
PROTO_DIST_FILE_PACK = File.join(PROTO_DIST_DIR, "#{PROTO_NAME}-pack.js")

# Add custom String methods to get an array of lines and to strip the whitespace
# after each line.
class String
  def lines
    split $/
  end
  
  def strip_whitespace_at_line_ends
    lines.map {|line| line.gsub(/\s+$/, '')} * $/
  end
end

# Set our default task to forward to the dist task.
task :default => :dist

# The dist task builds and packs proto.
desc "Builds and packs the Proto distribution"
task :dist => [:build, :pack]

desc "Concats source files and builds proto.js"
task :build do
  require 'erb'
  
  # Build our list of source files in order of which to build.
  src_files = [
    'proto',
    'accordion',
    'areaselector',
    'imageobserver',
    'maskedinput',
    'observable',
    'progressbar',
    'silverlight',
    'splitter',
    'tabcontrol',
    'toolbar',
    'tree'
  ].map { |s| File.join(PROTO_SRC_DIR, "#{s}.js") } # Add the source directory
  
  # Insert our header file at the beginning of the array.
  src_files.insert(0, File.join(PROTO_SRC_DIR, 'HEADER'))

  # Create the dist directory
  if !File.directory?(PROTO_DIST_DIR)
    FileUtils.mkdir 'dist'
  end

  # Delete the existing proto.js
  if File.exist?(PROTO_DIST_FILE)
    File.delete(PROTO_DIST_FILE)
  end
  
  # Open a new proto.js with read/write
  protofile = File.open(PROTO_DIST_FILE, 'w+')
  
  # Loop through each source file
  src_files.each do |filename|
    # Replace any template variables in the file and replace them with values locally
    template = ERB.new(File.read(filename))
    protofile.puts(template.result(binding).strip_whitespace_at_line_ends)
    
    # Add an extra line after each file
    protofile.puts("\n")
  end
  
  protofile.close
end

desc "Packs proto.js using PackR"
task :pack => :build do
  require 'packr'

  # Create the dist directory
  if !File.directory?(PROTO_DIST_DIR)
    FileUtils.mkdir 'dist'
  end
  
  # Delete any existing packed file
  if File.exist?(PROTO_DIST_FILE_PACK)
    File.delete(PROTO_DIST_FILE_PACK)
  end
  
  # Open the packed file with read/write
  protopacked = File.open(PROTO_DIST_FILE_PACK, 'w+')
  
  # First, add the HEADER file
  protopacked.puts(ERB.new(File.read(File.join(PROTO_SRC_DIR, 'HEADER'))).result(binding))
  
  # Lastly, pack the proto.js file and add it to the packed file
  protopacked.puts(Packr.new.pack(File.read(PROTO_DIST_FILE), :base62 => true, :shrink_vars => false))
  
  protopacked.close
end