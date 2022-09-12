window.customElements.define('search-box', class extends HTMLElement {
    constructor() {
        super();

        const shadow = this.attachShadow({mode: 'open'});
        shadow.innerHTML = `
            <style>${this.#style}</style>
            <div class="search">
                <input type="text" placeholder="Search" required="required"></input>
                <button tabindex="-1">✕</button>
                <ul class="autocomplete"></ul>
            </div>
        `;

        const _this = this;
        const _inputText = shadow.querySelector('.search > input');
        const _autocompleteList = shadow.querySelector('.search > .autocomplete');
        const _clearButton = shadow.querySelector('.search > button');
        
        async function _search() {
            const search = _inputText.value;
            const results = await _this.#search(search);
            _inputText.blur();
            _autocompleteList.innerHTML = null;

            _dispatchOnSearch(results);
        }

        async function _autocomplete() {
            const searchString = _inputText.value;
            const autocompleteResults = await _this.#autocomplete(searchString);

            _autocompleteList.innerHTML = null;
            autocompleteResults.forEach(result => {
                const listItem = document.createElement('li');
                listItem.textContent = result;
                listItem.tabIndex = 0;

                function searchForResult() {
                    _inputText.value = listItem.textContent;
                    _search();
                    listItem.blur();
                }

                listItem.onclick = () => { searchForResult() };
                listItem.onkeydown = async (event) => {
                    switch (event.key) {
                        case 'Enter': searchForResult(); break;
                        case 'Escape': _clear(); break;
                    }
                }
                _autocompleteList.appendChild(listItem);
            });
        }

        function _clear() {
            _autocompleteList.innerHTML = null;
            _inputText.value = null;
            _inputText.focus();
            
            _dispatchOnSearch(null);
        }

        function _dispatchOnSearch(results) {
            const event = new CustomEvent('onsearch', {
                detail: results,
                composed: true
            });
            _this.dispatchEvent(event);

            if (_this.onsearch instanceof Function) {
                _this.onsearch(event);
            } else {
                eval(_this.getAttribute('onsearch'))
            };
        }

        _inputText.onkeydown = async (event) => {
            switch (event.key) {
                case 'Enter': _search(); break;
                case 'Escape': _clear(); break;
            }
        }

        _inputText.oninput = async () => {
            const searchString = _inputText.value;

            if (searchString.length > 0) {
                _autocomplete();
            } else {
                _autocompleteList.innerHTML = null;
            }
        }

        _clearButton.onclick = _clear;
    }

    get url() {
        return this.getAttribute('url');
    }

    get onsearch() {
        return this.getAttribute('onsearch');
    }

    #style = `
        .search {
            position: relative;
            width: 100%;
        
            border-radius: 10px;
            border-color: #c0c0c0;
            border-style: solid;
            border-width: 1px;

            /* Blurred background */
            z-index: 1;
            background-color: rgba(255, 255, 255, 0.5);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        }
        
        .search > input {
            width: 100%;
        
            border: 0;
            margin: 0;
            padding: 0.625em 38px;
            box-sizing: border-box;
        
            font: inherit;
        
            appearance: none;
            background-color: transparent;
            -moz-appearance: none;
            -webkit-appearance: none;
            outline: none;
        
            background-image: url(images/search.svg);
            background-size: 20px;
            background-repeat: no-repeat;
            background-position: center;
        }
        
        .search > input:focus,
        .search > input:valid {
            background-position-x: 10px;
        }
        
        .search > input::placeholder {
            color: transparent;
        }
        
        .search > input:focus::placeholder {
            color: #c0c0c0;
        }
        
        .search > input:valid + button {
            display: inline-block;
        }
        
        .search > button {
            display: none;
            position: absolute;
            top: 0;
            right: 0;
            width: 40px;
            height: 40px;
        
            border-radius: 9px;
            border: 0;
            
            background-color: transparent;
            color: inherit;
            text-align: center;

            cursor: pointer;
        }
        
        .search > button:hover {
            opacity: 0.5;
        }

        .search:not(:focus-within) > .autocomplete {
            display: none;
        }

        .search > .autocomplete {
            display: block;
            border-top: 1px solid #e0e0e0;
            list-style-type: none;
            margin: 0;
            padding: 0;
        }

        .search > .autocomplete:empty {
            display: none;
        }

        .search > .autocomplete > li {
            padding: 0.625em 38px;
            box-sizing: border-box;
            cursor: pointer;
        }

        .search > .autocomplete > li:last-child {
            border-radius: 0 0 9px 9px;
        }

        .search > .autocomplete > li:hover {
            background-color: rgba(0, 0, 0, 0.15);
        }
    `

    async #autocomplete(search) {
        const data = await this.#graphql({
            query: `
                query ProductsAutocomplete($search: String) {
                    productsAutocomplete(search: $search)
                }
            `,
            variables: {
                search: search
            }
        }) || {};
        
        return data.productsAutocomplete || [];
    }

    async #search(search, offset, limit) {
        const data = await this.#graphql({
            query: `
                query Products($search: String, $offset: Int, $limit: Int) {
                    products(search: $search, offset: $offset, limit: $limit) {
                        id,
                        name,
                        image,
                        price
                    }
                }
            `,
            variables: {
                search: search,
                offset: offset || 0,
                limit: limit || 20
            }
        }) || {};
        
        return data.products || [];
    }

    async #graphql(gql) {
        if (!this.url) { return; }

        const response = await fetch(new URL('_graphql', this.url), {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-Request-Type': 'GraphQL'
            },
            body: JSON.stringify(gql),
        })
        const json = await response.json();

        if (json, json.errors) {
            console.error(JSON.stringify(json.errors));
        }

        return json ? json.data : null;
    }
  });