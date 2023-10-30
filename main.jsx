"use strict";

const contents = [
    {
        "name": "謎解きアンサーチェッカーのデモ",
        "text": <>
            https://github.com/amigurumicats/nazo_checker
        </>,
        "tags": ["ツール"],
        "url": "nazochecker_demo",
        "search_tags": ["なぞときあんさーちぇっかーのでも"]
    },
    {
        "name": "timerTA",
        "text": <>
            ストップウォッチの小数点以下2桁をコンプリートしよう！
        </>,
        "tags": ["ゲーム"],
        "url": "timerTA",
        "search_tags": ["たいまー"]
    },
    {
        "name": "ICARUSリソースシミュレータ",
        "text": <>
            「ICARUS サバイブイカルス」の必要素材を計算するツール
        </>,
        "tags": ["ツール"],
        "url": "icarus",
        "search_tags": ["icarus", "しゅみれーた", "しみゅれーた", "シミュレーター", "シミュレーター"]
    }
];

const all_tags = (() => {
    let tag_set = new Set();
    for (const content of contents) {
        tag_set = new Set([...tag_set, ...content.tags]);
    }
    return [...tag_set];
})();

const App = () => {
    const [search_text, set_search_text] = React.useState("");
    const [search_tags, set_search_tags] = React.useState(new Set());

    const display_contents = (() => {
        let result = contents;
        if (search_text.length > 0) {
            result = result.filter((c) => c["name"].includes(search_text) || c["search_tags"].some((stag) => stag.includes(search_text)));
        }
        if (search_tags.size > 0) {
            result = result.filter((c) => c["tags"].some((tag) => search_tags.has(tag)));
        }
        return result;
    })();


    return (<>
        <input type="text" value={search_text} onChange={(e) => set_search_text(e.target.value)} placeholder="search"></input>
        <div className="icon_search"></div>
        <div className="tags search_tags">
            {all_tags.map((tag) =>
                <div
                    key={tag}
                    className={`tag ${search_tags.has(tag) ? "active" : ""}`}
                    onClick={() => {
                        if (search_tags.has(tag)) {
                            set_search_tags(new Set([...search_tags].filter((t) => t !== tag)));
                        } else {
                            set_search_tags(new Set([...search_tags, tag]));
                        }
                    }}
                >{tag}</div>
            )}
        </div>
        {display_contents.map((content) =>
            <div key={content["name"]} className="content_container" >
                <a href={content["url"]}><div className="content_jump"><div className="icon_jump"></div></div></a>
                <div className="content_container_inner">
                    <div className="content_name">{ content["name"] }</div>
                    <div className="content_text">{ content["text"] }</div>
                    <div className="tags">
                        {content["tags"].map((tag) => <div key={`${content["name"]} ${tag}`} className="tag">{ tag }</div>)}
                    </div>
                </div>
            </div>
        )}
    </>);
};

const domContainer = document.querySelector("#app");
const root = ReactDOM.createRoot(domContainer);
root.render(React.createElement(App));
