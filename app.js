const yi = require('yi-action-camera');
const recorder = require('node-record-lpcm16')
const util = require('util');
const fs = require('fs')
const exec = util.promisify(require('child_process').exec);

const playCountDown = (somethingToSay, afterNbSec) => setTimeout(() => exec(`say "${somethingToSay}"`), afterNbSec * 1000);

const getCurrrentTime = () =>  new Date().toJSON().slice(0,19).split('T')[1];

(async () => {

    const shotDate = new Date().toJSON().slice(0,19).replace(':','-').replace(':','-');

    await yi.connect();

    console.log(`[log]  ${getCurrrentTime()} Connected to camera 👍`);

    await exec(`say "get ready in 10 seconds"`);

    await new Promise((resolve, reject) => setTimeout(() => resolve(), 10000));

    playCountDown(9, 1)
    playCountDown(5, 5)
    playCountDown(3, 7)
    playCountDown(2, 8)
    playCountDown(1, 9)

    await new Promise((resolve, reject) => setTimeout(() => resolve(), 10000));

    const tempAudioFileName = `./shots-data/temp-audio-shot-${shotDate}`;

    console.log(`[log] ${getCurrrentTime()} tempAudioFileName will be sotred at ${tempAudioFileName}`);

    const file = fs.createWriteStream(`${tempAudioFileName}.wav`, {
        encoding: 'binary'
    })

    const recording = recorder.record({
        sampleRate: 44100
    });
    recording.stream().pipe(file);

    console.log(`[log] ${getCurrrentTime()} Audio recording started`);

    await yi.startRecord();

    console.log(`[log] ${getCurrrentTime()} Video recording started`);

    await new Promise((resolve, reject) => setTimeout(() => resolve(), 3000));

    const filePath = await yi.stopRecord();

    console.log(`[log] ${getCurrrentTime()} Video recording ended`);

    exec(`say "end"`);

    recording.stop();

    console.log(`[log] ${getCurrrentTime()} audio recording ended`);

    console.log(`[log] ${getCurrrentTime()} video download is starting...`);
    await yi.downloadFile(filePath,'./shots-data/');


    await yi.disconnect();
    console.log(`[log] ${getCurrrentTime()} camera is now disconnected`);


    const cleanFilePath = filePath.split('/')[filePath.split('/').length - 1 ].replace('.mp4','');


    fs.renameSync(`${tempAudioFileName}.wav`,`./shots-data/${cleanFilePath}.wav`);

    console.log(`[log] ${getCurrrentTime()} audio file has been renamed  from ${tempAudioFileName}.wav to ${cleanFilePath}.wav `);


    console.log(`[log] ${getCurrrentTime()} sound is now analyzed to find when the shot occured`);

    const soundAnalysisResult = await exec(`node soundDetect.js ./shots-data/${cleanFilePath}.wav`);

    console.log(`[log] ${getCurrrentTime()} sound analisis succed, ${soundAnalysisResult}`);

    console.log(`[log] ${getCurrrentTime()} reading the result of the sound analysis`);

    const audioAnalysisFile = fs.readFileSync(`./shots-data/${cleanFilePath}-highest-point.json`,'utf-8');

    const whenTheImpactHappened = JSON.parse(audioAnalysisFile);

    console.log(`[log] ${getCurrrentTime()} impact happened at ${whenTheImpactHappened.timePoint}`);

    console.log(`[log] ${getCurrrentTime()}  video striping is starting now cutting the video at  00:00:0${whenTheImpactHappened.timePoint} for 0.3sec`);
    await exec(`ffmpeg -ss 00:00:0${whenTheImpactHappened.timePoint} -i ./shots-data/${cleanFilePath}.mp4 -c copy -t 00:00:00.3 ./shots-data/${cleanFilePath}-short.mp4`);

    // await exec(`ffmpeg -i ./shots-data/${cleanFilePath}-short.mp4 -vf  "setpts=10*PTS" -an ./shots-data/slowedDown-${cleanFilePath}-short.mp4`);

})().catch(console.log)