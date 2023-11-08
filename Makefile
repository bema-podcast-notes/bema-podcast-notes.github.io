# For additional usage doc, see: https://jekyllrb.com/docs/usage/

setup:
	# The script below is incomplete
	# ...
	# /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
	# brew install chruby ruby-install xz
	# ruby-install ruby 3.1.3
	# echo "source $(brew --prefix)/opt/chruby/share/chruby/chruby.sh" >> ~/.zshrc
	# echo "source $(brew --prefix)/opt/chruby/share/chruby/auto.sh" >> ~/.zshrc
	# echo "chruby ruby-3.1.3" >> ~/.zshrc 
	# ruby -v
	bundle install
	# gem install jekyll
	# bundle install --gemfile=jekyll

	# Install modules required for generating yaml files:
	pwsh -Command Install-Module -Name powershell-yaml -Confirm

buildyaml:
	pwsh ./_scripts/gen-episodes-yaml.ps1
	exit

build:
	bundle exec jekyll build

clean:
	bundle exec jekyll clean

run:
	bundle exec jekyll serve --livereload
	# => Now browse to http://127.0.0.1:4000/