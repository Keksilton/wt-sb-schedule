$(document).ready(function () {
    const now = moment();
    const moscow = now.clone().utcOffset('+03:00');
    const battleRatings = [4, 4.7, 5.3, 6, 6.7, 7.3, 8, 9, 10];
    const timeFramesData = [
        [4, 10],
        [17, 1]
    ]

    function setup() {
        fillTimeline();
        fillTimeframes();
    }

    function fillTimeframes() {
        $timeframes = $('#timeframes');
        const children = $timeframes.children();
        for (let i = 0; i < children.length; ++i) {
            const $child = $(children[i]);
            const index = $child.data('timeframe');
            const a = timeFramesData[index];
            const timeframe = new Timeframe(a[0], a[1]);
            timeframe.attach($child);
        }
    }

    class Timeframe {
        $node;
        updater;
        constructor(start, end) {
            this.duration = end - start + (end < start ? 24 : 0);
            this.start = moment().utcOffset('+03:00').startOf('hour').hour(start).local();
            this.end = this.start.clone().add(this.duration, 'hours');
        }

        get active() { return this.$node.attr('active') == true; }
        set active(val) { this.$node.attr('active', val ? true : null); }

        attach($node) {
            this.$node = $node;
            if (this.updater) {
                clearInterval(this.updater);
            }
            this.updater = setInterval(() => {
                this.updateActive();
            }, 60 * 10);
            this.updateContent();
        }

        update() {
            const now = moment();
            if (now.diff(this.start, 'hours') > this.duration) {
                this.start.add(Math.floor(this.duration / 24) + 1, 'days');
                this.end = this.start.clone().add(this.duration, 'hours');
                this.updateContent();
            }
        }

        updateContent() {
            this.$node.text(`From ${this.start.format('LT')} to ${this.end.format('LT')}`);
        }

        updateActive() {
            if (!this.$node) {
                console.warn('attach timeframe to a node first');
                return;
            }
            const now = moment();
            this.update();
            this.active = this.start <= now && this.end >= now;
        }
    }

    function fillTimeline() {
        const season = new Season();
        const content = 'Prepare your AAs';
        for (let week of season.weeks) {
            addTimelineNode(`Squadron battles, ${week.br.toFixed(1)}`, week.start.format('LL'), content)
                .setWeek(week, 60 * 100)
        }
        addTimelineNode('Season end.', season.end.format('LL'), 'AAs can rest now')
    };

    function addTimelineNode(headline, dateText, content) {
        const $timeline = $('#brChangeTimeline');
        const node = new TimelineNode(headline, dateText, content);
        return node.attach($timeline);
    }

    class TimelineNode {
        activeTimer;
        $itemNode;
        constructor(headline, dateString, content) {
            this.$headlineNode = $('<a></a>')
                .attr('class', 'timeline-header')
                .text(headline);
            this.$dateNode = $('<a></a>')
                .addClass('float-right')
                .text(dateString);
            this.$contentNode = $('<p></p>')
                .text(content);
            this.$itemNode = $('<li></li>')
                .append(this.$headlineNode)
                .append(this.$dateNode)
                .append(this.$contentNode);
        }

        attach($timeline) {
            $timeline.append(this.$itemNode);
            return this;
        }

        setWeek(week, interval) {
            if (this.activeTimer != null) {
                clearInterval(this.activeTimer)
                this.activeTimer = null;
            }
            const activeHandler = () => {
                const now = moment();
                this.$itemNode.attr('active', now >= week.start && now <= week.end ? true : null);
            };
            activeHandler();
            this.activeTimer = setInterval(activeHandler, interval);
            return this;
        }
    }

    class Season {
        constructor() {
            this.start = moscow.clone().startOf('month').subtract(moscow.month() % 2, 'month').hour(timeFramesData[0][0]).local();
            this.end = moscow.clone().startOf('month').add((moscow.month() + 1) % 2, 'month').endOf('month').startOf('day').add(1, 'day').hour(timeFramesData[1][1]).local();
            this.weeks = battleRatings.map((br, i) => new Week(this, i, br));
        }
    }

    class Week {
        constructor(season, weekIndex, br) {
            this.start = season.start.clone().add(weekIndex, 'weeks');
            this.end = season.end.diff(this.start, 'days') > 7 ? this.start.clone().add(7, 'day') : season.end.clone();
            this.br = br;
        }

        get isCurrent() {
            const now = moment();
            return now >= this.start && this.end >= now;
        }
    }

    setup();
});