$(document).ready(function () {
    const locale = window.navigator.userLanguage || window.navigator.language;

    function setup() {
        fillTimeline();
        fillTimeframes();
    }

    function fillTimeframes() {
        let timeframeRoot = $('#timeframes')[0];
        let timeframes = [];
        let key = 0xBE6111;
        for (let tf of timeFramesData) {
            const timeframeElement = React.createElement(Timeframe, { key: key++, timeframe: { start: tf[0], end: tf[1] } });
            timeframes.push(timeframeElement);
        }
        ReactDOM.render(timeframes, timeframeRoot);
    }

    class Timeframe extends React.Component {
        constructor(props) {
            super(props);
            const now = moment();
            const moscow = now.clone().tz('Europe/Moscow');

            this.state = {
                start: moscow.clone().startOf('hour').hour(props.timeframe.start).local().locale(locale).subtract(moscow.day() != now.day() ? (now.utcOffset() < moscow.utcOffset() ? 1 : -1) : 0, 'days'),
                duration: props.timeframe.end - props.timeframe.start + (props.timeframe.end < props.timeframe.start ? 24 : 0)
            }
        }

        tick() {
            this.setState(state => {
                const now = moment();
                state.start = state.start.add(now.diff(state.start, 'hours') > state.duration ? 1 : 0, 'days');
                state.active = now > state.start && now.diff(state.start, 'hours') < state.duration;
                return state;
            });
        }
        componentDidMount() {
            this.tick();
            this.interval = setInterval(() => this.tick(), 60 * 1000);
        }

        componentWillUnmount() {
            clearInterval(this.interval);
        }

        render() {
            return React.createElement('div', { active: this.state.active ? 'true' : null }, 'From ', this.state.start.format('LT'), ' to ', this.state.start.clone().add(this.state.duration, 'hours').format('LT'));
        }
    }

    function fillTimeline() {
        const timelineRoot = $('#brChangeTimeline')[0];
        const timelineElements = React.createElement(Timeline, { timeframe: { firstStart: timeFramesData[0][0], lastEnd: timeFramesData[timeFramesData.length - 1][0] } });
        ReactDOM.render(timelineElements, timelineRoot);
    };

    class Timeline extends React.Component {
        _key = 0x6F2F;
        constructor(props) {
            super(props);

            this.state = {
                timeframe: {
                    start: props.timeframe.firstStart,
                    end: props.timeframe.lastEnd
                }
            }
        }

        tick() {
            const now = moment();
            const moscow = now.clone().tz('Europe/Moscow');

            this.setState(state => {
                let data = {
                    timeframe: state.timeframe,
                    season: {
                        start: moscow.clone().startOf('month').subtract(moscow.month() % 2, 'month').hour(state.timeframe.start).local().locale(locale),
                        end: moscow.clone().startOf('month').add((moscow.month() + 1) % 2, 'month').endOf('month').startOf('day').add(Math.floor((state.timeframe.end - state.timeframe.start) / 24), 'day').hour(state.timeframe.end).local().locale(locale)
                    }
                };
                data.weeks = battleRatings.map((desc, i) => ({
                    start: data.season.start.clone().add(i, 'weeks'),
                    br: desc.br,
                    message: desc.message,
                    index: i
                })).map(week => {
                    week.end = data.season.end.diff(week.start, 'days') > 7 ? week.start.clone().add(1, 'week').hour(data.season.end.hour()) : data.season.end.clone();
                    week.active = now >= week.start && now <= week.end;
                    return week;
                });
                return data;
            });
        }

        componentDidMount() {
            this.tick();
            this.interval = setInterval(() => this.tick(), 60 * 60 * 1000);
        }

        componentWillUnmount() {
            clearInterval(this.interval);
        }

        static generateNode(title, date, content, active) {
            return React.createElement('li', { key: Math.random() * 100.5, active: active ? 'true' : null }, [
                React.createElement('a', { className: 'timeline-header', key: Math.random() * 100.5 }, title),
                React.createElement('a', { className: 'float-right', key: Math.random() * 100.5 }, date),
                React.createElement('p', { key: Math.random() * 100.5 }, content)
            ]);
        }

        render() {
            if (this.state.weeks) {
                let nodes = this.state.weeks.map(week => Timeline.generateNode(`Squadron battles, ${week.br.toFixed(1)}`, week.start.format('LL'), week.message, week.active));
                nodes.push(Timeline.generateNode(`Season end`, this.state.season.end.format('LL'), '', false));
                return React.createElement('ul', { className: 'timeline p-3' }, nodes);
            } else {
                return React.createElement('div', {}, 'Loading weeks...');
            }
        }
    }

    setup();
});