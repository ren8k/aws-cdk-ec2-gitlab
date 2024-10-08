docker run --detach \
    --name gitlab \
    --hostname 'mlops-gitlab' \
    --publish 80:80 \
    --restart always \
    --env GITLAB_OMNIBUS_CONFIG="external_url 'http://35.76.241.254'; \
        gitlab_rails['time_zone'] = 'Asia/Tokyo'; \
        gitlab_rails['gitlab_email_from'] = 'gitlab@example.com'; \
        gitlab_rails['initial_root_password'] = 'g1tl@b241007';" \
    --shm-size 256m \
    gitlab/gitlab-ce:latest

# 上記の場合，データは揮発性であるため，以下のように永続化が必要

    # --volume $GITLAB_HOME/config:/etc/gitlab \
    # --volume $GITLAB_HOME/logs:/var/log/gitlab \
    # --volume $GITLAB_HOME/data:/var/opt/gitlab \
