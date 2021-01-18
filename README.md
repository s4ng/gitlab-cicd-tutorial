# CICD-DINO

## 개요

Gitlab CI/CD와 Docker를 이용하여 코드 자동 병합, 배포 자동화 등을 직접 구현하여 본다.

## 프로세스

**dev 브랜치**
1. 린트 (ESlint)
2. 테스트 (Mocha)

**master 브랜치**
1. 린트 (ESlint)
2. 테스트 (Mocha)
3. 빌드 (Docker)

## Stages

### Lint
Node.js 라이브러리인 ESlint를 사용하여 lint 체크를 하였다.
이 과정에서 .eslintrc.yml파일을 작성했는데, gcloud팀의 설정 파일을 많이 참고하였다.
큰 틀에서는 eslint 공식 추천 옵션을 사용하였고, no-console, indent 등 자잘한 부분은 직접 설정한 옵션으로 사용하였다.
```bash
eslint . --fix
```
명령어를 사용하여 프로젝트 전체에 대해서 체크하고 --fix 명령어를 사용하여 코드 교정은 자동으로 하도록 했다.

### Test
Mocha라는 테스트 라이브러리를 사용하였다.
~~.spec.js 파일로 테스트 파일을 생성하고 그 안에 테스트 코드를 작성하는 식으로 구현한다.
decribe() 로 테스트의 범위를 설정하고 그 내부에서 it()으로 단위 테스트를 지정한다

Chai는 단언 라이브러리이다. 기대값과 결과값을 비교해서 작동상태를 표명하는 역할을 한다.
```javascript
// 루트에 http 리퀘스트를 보냈을 때 http 코드 200이 나오는지 테스트하는 코드
describe('# app test start', () => {
	it('should return code 200', (done) => {
		chai.request(app)
			.get('/')
			.end((err, res) => {
				res.should.have.status(200)
				done()
			})
	})
})
```

### Build
여기서 build는 배포용 바이너리 파일을 만드는 것이 아니라 Docker hub에 push하기 위한 Docker image를 만드는 것을 말한다.
```Dockerfile
#Dockerfile
FROM node:latest

WORKDIR /usr/src/app

COPY . /usr/src/app
RUN npm install

EXPOSE 3000
CMD [ "node", "app.js" ]
```
Gitlab CI의 설정파일에서 아래와 같이 명세하면 로컬에서 작동하는 Gitlab Runner가 image로 빌드한 후 Docker hub에 login하고 push까지 하게 된다.
```yml
  before_script:
    - echo "$CI_REGISTRY_PASSWORD" | docker login -u "$CI_REGISTRY_USER" $CI_REGISTRY --password-stdin
  script:
    - docker build --pull -t "$CI_REGISTRY_IMAGE:latest" .
    - docker push "$CI_REGISTRY_IMAGE:latest"
```

### Deploy
배포는 배포환경으로 주어진 gCloud 리눅스 서버에 하였다.
원래 Gitlab CI 내에서 배포환경 접속 후 배포까지 하는것이 요구사항이었으나, 뜻을 잘 이해하지 못해서 다른 방식으로 하게 되었다.

배포환경에서 간단한 Node.js (express) 앱을 실행시키고 이 앱에서 shell script를 실행시키는 방법을 사용하였다.
Docker hub에서는 이런 상황에 대비하여 기본적으로 webhook을 제공하고 있었다.
image를 푸시하면 이런 식으로 http request가 날아온다
```json
{
  push_data: { pushed_at: 1610945328, images: [], tag: 'latest', pusher: 's4ng' },
  callback_url: 'https://registry.hub.docker.com/u/s4ng/cicd-dino/hook/24dh2h520ehd54301cba2hi2g1eceh14b/',
  repository: {
    status: 'Active',
    description: '',
    is_trusted: false,
    full_description: null,
    repo_url: 'https://hub.docker.com/r/s4ng/cicd-dino',
    owner: 's4ng',
    is_official: false,
    is_private: false,
    name: 'cicd-dino',
    namespace: 's4ng',
    star_count: 0,
    comment_count: 0,
    date_created: 1610495333,
    repo_name: 's4ng/cicd-dino'
  }
}
```

express 앱에서 shell script를 실행시키기 위해서 shelljs라는 라이브러리를 사용하였다.
간단한 코드로 쉽게 .sh 파일을 실행시킬 수 있었다.
```javascript
// app.js
const runningShell = () => {
    shell.exec('./shell/deploy.sh');
}
```
```bash
# shell/deploy.sh
#!/bin/bash
PORT=6379
REPOSITORY=s4ng/cicd-dino
NAME=cicdapp

docker container stop $(docker container ls -q --filter name=$NAME)
docker rmi $(docker images -q $REPOSITORY)
docker pull $REPOSITORY
docker run -d --rm --name $NAME -p $PORT:$PORT $REPOSITORY
exit 0
```

배포환경의 express앱은 [여기](https://github.com/s4ng/docker-listener)에 올려놓았다.