export function HoursToMs(hours) {
    return hours * 60 * 60 * 1000;
}


export class Timer {
    Start() {
        this.startTimeMS = (new Date()).getTime();
    }
    TimeMS() {
        return (new Date()).getTime() - this.startTimeMS;
    }
}