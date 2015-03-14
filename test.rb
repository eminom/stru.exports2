#! /usr/local/bin/ruby
# manually installed on my Ubuntu-10.04

# config:
target_name = 'EsNode'

def node_path_finder
	n_path = `which node`
	if n_path.size == 0 then
		print "node is not installed\n"
		exit
	end
	n_path.chomp
end


# main:
node_path = node_path_finder
script_path = File.absolute_path(File.dirname(__FILE__))
input_path = "#{script_path}/.input/#{target_name}.stru"
output_path = "#{script_path}/#{target_name}.json"
parser_path = "#{script_path}/parser"
output_inc  = "#{script_path}/#{target_name}.inc"

cmd = "#{parser_path} < #{input_path} > #{output_path}"
if true != system(cmd) then
	print cmd, "\n"
	print $?, "\n"
	exit
end

makejs_path = script_path + "/js/make.js"
cmd = "#{node_path} \"#{makejs_path}\" \"#{output_path}\" >  #{output_inc}"
print cmd,"\n"
if true != system(cmd) then
	print cmd,"\n"
	print $?, "\n"
	exit
end

print "Finished\n"

