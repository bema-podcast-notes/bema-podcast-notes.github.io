# For additional usage doc, see: https://jekyllrb.com/docs/usage/

buildyaml:
	pwsh ./_scripts/gen-episodes-yaml.ps1
	exit

build:
	bundle exec jekyll build

clean:
	bundle exec jekyll clean

run:
	bundle exec jekyll serve --livereload
	# => Now browse to http://localhost:8080