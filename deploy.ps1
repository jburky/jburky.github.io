flutter build web

Copy-Item -Recurse -Force ./build/web/*.* ../jburky.github.io/

git --git-dir=../jburky.github.io/.git pull
git --git-dir=../jburky.github.io/.git add *
git --git-dir=../jburky.github.io/.git commit -m "Auto deploy"
git --git-dir=../jburky.github.io/.git push
