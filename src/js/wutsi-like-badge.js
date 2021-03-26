class WutsiLike {
    config = {
        device_uuid_cookie: '__w_duaid',
        user_id: null
    };

    constructor(root, like_store, cookie_store) {
        this.like_store = like_store ? like_store : new WutsiLikeStore();
        this.cookie_store = cookie_store ? cookie_store : new CookieStore();

        const likes = (root ? root : document).querySelectorAll("[role='wutsi-like-badge']");
        if (likes) {
            const me = this;
            likes.forEach(function (like) {
                me._render(like);
                me._update_count(like);
                me._update_liked(like);
                like.addEventListener("click", function () {
                    me.on_click(like)
                })
            });
        }
    }

    on_click(like) {
        const url = like.getAttribute("data-url");
        const id = like.getAttribute("data-like-id");

        if (id)
            this.on_unlike(like, id)
        else if (url)
            this.on_like(like, url)
    }

    on_like(like, url) {
        const me = this;
        const user_id = this.config.user_id;
        const device_uuid = this.cookie_store.get(this.config.device_uuid_cookie);

        this.like_store.like(url, user_id, device_uuid)
            .then(data => {
                like.setAttribute('data-like-id', data.likeId)
                me._update_count(like);
            });
    }

    on_unlike(like, id) {
        const me = this;
        this.like_store.unlike(id)
            .then(response => {
                like.removeAttribute('data-like-id')
                me._update_count(like);
            });
    }

    _render(like) {
        like.innerHTML = '<div style="padding: 0.5em 0; cursor: pointer">' +
            '<i class="far fa-heart" style="font-size: 1.5em"></i>' +
            '<span class="count" style="font-size: 1.5em; margin-left: .5em"></span>' +
            '</div>';
    }

    _update_count(like) {
        const url = like.getAttribute("data-url");
        this.like_store.stats(url)
            .then(data => {
                if (data.count > 0)
                    like.querySelector(".count").textContent = data.count;
                else
                    like.querySelector(".count").textContent = '';
            });
    }

    _update_liked(like) {
        const url = like.getAttribute("data-url");
        const device_uuid = this.cookie_store.get(this.config.device_uuid_cookie);
        const user_id = this.config.user_id;

        this.like_store.search(url, user_id, device_uuid)
            .then(data => {
                if (data.likes.length > 0) {
                    like.setAttribute("data-like-id", data.likes[0].id);
                }
            });
    }
}

class WutsiLikeStore {
    baseUrl = 'https://wutsi-test-like-service.herokuapp.com/v1/likes';

    // baseUrl = 'http://localhost:8080/v1/likes';

    stats(url) {
        const xurl = this._to_url('/stats?canonical_url=' + url);
        console.log('stats', xurl);
        return fetch(xurl)
            .then(response => response.json());
    }

    like(url, user_id, device_uuid) {
        const body = {
            canonicalUrl: url,
            deviceUUID: device_uuid,
            userId: user_id
        };

        return fetch(this._to_url(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })
            .then(response => response.json())
    }

    unlike(id) {
        return fetch(this._to_url('/' + id), {
            method: 'DELETE',
        });
    }

    search(url, user_id, device_uuid) {
        var url = '?canonical_url=' + url + '&limit=1';
        if (device_uuid) {
            url += '&device_uuid=' + device_uuid;
        }
        if (user_id) {
            url += '&user_id=' + user_id;
        }

        return fetch(this._to_url(url))
            .then(response => response.json())
    }

    _to_url(path) {
        return path ? this.baseUrl + path : this.baseUrl;
    }
}

class CookieStore {
    get(name) {
        var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? match[2] : null;
    }
}

new WutsiLike(document);
