# For additional usage doc, see: https://jekyllrb.com/docs/usage/

build:
	bundle exec jekyll build

clean:
	bundle exec jekyl clean

run:
	bundle exec jekyll serve --livereload
	# => Now browse to http://localhost:8080