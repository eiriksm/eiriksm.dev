set -e
./vendor/bin/drush cex -y
git status
[[ -z $(git status -s | grep -v "web/sites/default/settings.php") ]] || exit 1
