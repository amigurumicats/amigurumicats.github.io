"use strict";

/*
TODO
- 演出
    - 新しく埋まった時
*/

const { createContext, useContext, useState } = React;


const make_default_board = () => {
    // keyが"00", "01", ... "99"なobjを作って返す
    const result = {};
    for (const d10 of "0123456789") {
        for (const d1 of "0123456789") {
            const n = `${d10}${d1}`;
            result[n] = 0;
        }
    }
    return result
}


const App = () => {
    const [totalTime, setTotalTime] = useState(0);
    const [gameInfo, setGameInfo] = useState({
        status: "init",  // "init", "running", "finished"
        start_time: null,
        interval_id: null,
        category: "100%",
        option: null,  // null, "1s_range", "no_reset"
    })

    const [time, setTime] = useState(0);
    const [timerInfo, setTimerInfo] = useState({
        is_run: false,
        start_time: null,
        interval_id: null,
        n_prev: null,
    });

    const [board, setBoard] = useState(make_default_board());

    const categories = [{cd: "100%", name: "100%"}, {cd: "90%", name: "90%"}, {cd: "1line", name: "1ビンゴ"}, {cd: "5line", name: "5ビンゴ"}];
    const options = [{cd: "1s_range", name: "1秒台のみ"}, {cd: "no_reset", name: "リセットしない"}];

    const isClear = () => {
        if (gameInfo.category.slice(-1) === "%") {
            const countCell = Object.values(board).filter((c) => c > 0).length;
            return parseInt(gameInfo.category.slice(0, -1)) <= countCell
        } else if (gameInfo.category.slice(-4) === "line") {
            let countLine = 0;
            for (const a of "0123456789") {
                // ヨコ
                countLine += Array.from("0123456789").every((b) => board[`${a}${b}`] > 0) ? 1 : 0;
                // タテ
                countLine += Array.from("0123456789").every((b) => board[`${b}${a}`] > 0) ? 1 : 0;
            }
            // 左上から右下
            countLine += Array.from("0123456789").every((a) => board[`${a}${a}`] > 0) ? 1 : 0;
            // 右上から左下
            countLine += ["09", "18", "27", "36", "45", "54", "63", "72", "81", "90"].every((n) => board[n] > 0) ? 1 : 0;
            return parseInt(gameInfo.category.slice(0, -4)) <= countLine
        }
    };

    const updateGameInfo = (updateObj) => {
        let gi = Object.assign({}, gameInfo);
        gi = Object.assign(gi, updateObj);
        setGameInfo(gi);
    }

    const onClickStartStop = () => {
        if (timerInfo.is_run) {
            // Stop
            const now = Date.now();
            const time = (now - timerInfo.start_time) / 1000;

            if (gameInfo.status === "finished") {
                clearInterval(timerInfo.interval_id);
                setTimerInfo({is_run: false, start_time: null, interval_id: null, n_prev: null});
                setTime(time);
                return
            }

            if (gameInfo.option !== "no_reset") {
                clearInterval(timerInfo.interval_id);
            }

            setTime(time);

            if (gameInfo.option === "1s_range" && time.toFixed(2).slice(0, -3) !== "1") {
                setTimerInfo({is_run: false, start_time: null, interval_id: null, n_prev: null});
                return
            }

            const n = time.toFixed(2).slice(-2);
            board[n] += 1;
            setBoard(Object.assign({}, board));

            if (gameInfo.option === "no_reset") {
                setTimerInfo(Object.assign({...timerInfo}, {n_prev: n}));
            } else {
                setTimerInfo({is_run: false, start_time: null, interval_id: null, n_prev: n});
            }

            setTime(time);  // clearIntervalが間に合わなかったときに表示と結果がずれるので、念のためもう一度

            if (board[n] === 1 && gameInfo.status === "running" && isClear()) {
                // クリア時処理
                if (gameInfo.option === "no_reset") {
                    clearInterval(timerInfo.interval_id);
                    const time = (now - timerInfo.start_time) / 1000;
                    setTime(time);
                }
                clearInterval(gameInfo.interval_id);
                setTotalTime((now - gameInfo.start_time) / 1000);
                updateGameInfo({status: "finished", interval_id: null});
            }
        } else {
            // Start
            const start_time = Date.now();
            const interval_id = setInterval(() => {
                // setIntervalは怪しいが、これはあくまでも参考表示であり、ちゃんとストップ時に算出してるので問題ないはず
                setTime((Date.now() - start_time) / 1000);
            }, 10);
            setTimerInfo({is_run: true, start_time, interval_id, n_prev: timerInfo.n_prev});

            if (gameInfo.status === "init") {
                const total_interval_id = setInterval(() => {
                    setTotalTime((Date.now() - start_time) / 1000);
                }, 10);
                updateGameInfo({status: "running", start_time, interval_id: total_interval_id});
            }
        }
    };

    const cellClass = (n) => {
        if (gameInfo.status === "finished") {
            if (board[n] == 0) return ""
            const ri = (parseInt(n[0]) + parseInt(n[1])) % 9;
            return `rainbow_${ri}`
        }
        if (n === timerInfo.n_prev) {
            return board[n] === 1 ? "active_new" : "active_now"
        }
        else if (board[n] == 0) return ""
        else if(board[n] == 1) return "active_1"
        else if(board[n] <= 3) return "active_2"
        else if(board[n] <= 6) return "active_3"
        else if(board[n] <= 9) return "active_4"
        else return "active_5"
    }

    const countActiveCell = Object.values(board).filter((c) => c > 0).length

    const clear_tweet_url = (() => {
        const url = new URL("https://twitter.com/intent/tweet");
        const category_str = (() => {
            const found_category = categories.find(category => category.cd === gameInfo.category);
            return found_category ? found_category.name : gameInfo.category
        })();
        const option_str = (() => {
            if (!gameInfo.option) return "オプションなし"
            const found_option = options.find(option => option.cd === gameInfo.option);
            return found_option ? found_option.name : "オプションなし"
        })();
        const text = `TimerTA(${category_str}、${option_str})を${totalTime.toFixed(2)}秒でクリアした！`;
        url.searchParams.set("text", text);
        url.searchParams.set("url", "https://amigurumicats.github.io/timerTA");
        return url.toString();
    })();

    return (
        <>
            <div className="time">{time.toFixed(2)}</div>
            <div className={`button_start_stop ${timerInfo.is_run ? "stop" : "start"}`} onClick={onClickStartStop}>{ timerInfo.is_run ? "Stop" : "Start" }</div>
            <div className="info">
                <div className="total_time">経過時間: {totalTime.toFixed(2)}</div>
                <div className="complete_rate">進捗: {countActiveCell}/100</div>
            </div>
            {gameInfo.status === "finished" &&
                <div className="clear">
                    クリア！
                    <a href={clear_tweet_url} className="button_tweet" target="_blank" rel="noopener noreferrer">
                        <img src="assets/twitter_logo.svg"></img>
                        ツイート
                    </a>
                </div>
            }
            <div className="categories">
                {
                    categories.map((category) => (
                        <div
                            key={category.cd}
                            className={`category ${gameInfo.category === category.cd ? "active" : ""} ${gameInfo.status === "init" ? "clickable" : "disabled"}`}
                            onClick={() => { if (gameInfo.status == "init") updateGameInfo({category: category.cd}); }}
                        >{category.name}</div>
                    ))
                }
            </div>
            <div className="options">
                {
                    options.map((option) => (
                        <div
                            key={option.cd}
                            className={`option ${gameInfo.option === option.cd ? "active" : ""} ${gameInfo.status === "init" ? "clickable" : "disabled"}`}
                            onClick={() => {
                                if (gameInfo.status !== "init") return
                                updateGameInfo({option: gameInfo.option === option.cd ? null : option.cd});
                            }}
                        >{option.name}</div>
                    ))
                }
            </div>

            <table className="board">
                <tbody>
                    {
                        Array.from("0123456789").map((d10) => (
                            <tr key={d10}>
                                {
                                    Array.from("0123456789").map((d1) => (
                                        <td
                                            key={d1}
                                            className={cellClass(`${d10}${d1}`)}
                                        >{`.${d10}${d1}`}</td>
                                    ))
                                }
                            </tr>
                        ))
                    }
                </tbody>
            </table>
        </>
    )
}


const domContainer = document.querySelector("#app");
const root = ReactDOM.createRoot(domContainer);
root.render(React.createElement(App));
