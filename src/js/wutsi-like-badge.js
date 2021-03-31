class WutsiLike extends HTMLElement {
    config = {
        environment: 'test',
        device_uuid_cookie: '__w_duaid',
        user_id: null
    };

    constructor(root, store) {
        super()

        this.store = store ? store : new WutsiLikeStore(this.config.environment);

        this.addEventListener("click", e => {
            this.onClick()
        });
    }

    connectedCallback() {
        this.innerHTML = '\
        <div style="padding: 0.5em 0; cursor: pointer">\
            <i class="icon far fa-heart"></i>\
            <span class="count"></span>\
        </div>\
        ';
        this.updateCount();
    }


    updateCount() {
        this.loading = true;
        this.store.stats(this.url, this.userId, this.deviceUUID)
            .then(data => {
                console.log(this.url, data);
                this.count = data.count
                this.liked = data.liked
            })
            .finally(() => {
                this.loading = false;
            });
    }

    onClick() {
        if (this.processing)
            return;

        this.processing = true;
        this.store.like(this.url, this.userId, this.deviceUUID)
            .then(data => {
                this.updateCount();
            })
            .finally(() => {
                this.processing = false;
            });
    }


    // Properties....
    get processing() {
        this.classList.contains('processing');
    }

    set processing(val) {
        if (val)
            this.classList.add('processing');
        else
            this.classList.remove('processing');
    }

    get loading() {
        this.classList.contains('loading');
    }

    set loading(val) {
        if (val)
            this.classList.add('loading');
        else
            this.classList.remove('loading');
    }

    get url() {
        return this.getAttribute("data-url");
    }

    get userId() {
        return this.config.user_id;
    }

    get deviceUUID() {
        return this._get_cookie(this.config.device_uuid_cookie);
    }

    get count() {
        return this.querySelector(".count").textContent
    }

    set count(val) {
        if (val > 0)
            this.querySelector(".count").textContent = val;
        else
            this.querySelector(".count").textContent = '';
    }

    get liked() {
        return this.classList.contains('liked');
    }

    set liked(val) {
        if (val)
            this.classList.add('liked')
        else
            this.classList.remove('liked')
    }

    _get_cookie(name) {
        var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? match[2] : null;
    }
}

class WutsiLikeStore {
    baseUrl = 'https://wutsi-like-service-test.herokuapp.com/v1/likes';

    constructor(environment) {
        if (environment == 'prod')
            this.baseUrl = 'https://wutsi-like-service-prod.herokuapp.com/v1/likes';
        else if (environment == 'local')
            this.baseUrl = 'http://localhost:8080/v1/likes';
    }

    stats(canonical_url, user_id, device_uuid) {
        var url = this._to_url('/stats?canonical_url=' + canonical_url);
        if (device_uuid) {
            url += '&device_uuid=' + device_uuid;
        }
        if (user_id) {
            url += '&user_id=' + user_id;
        }

        return fetch(url)
            .then(response => response.json());
    }

    like(canonical_url, user_id, device_uuid) {
        const body = {
            canonicalUrl: canonical_url,
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

    _to_url(path) {
        return path ? this.baseUrl + path : this.baseUrl;
    }
}

window.customElements.define('wutsi-like', WutsiLike);
