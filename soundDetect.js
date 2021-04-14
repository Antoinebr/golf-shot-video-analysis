const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

process.argv.splice(0, 2);

let [soundFilePath = false, ] = process.argv;

if (!soundFilePath) {
  throw new error('Missing soundFilePath URL ! Provide the soundFilePath  as a first Command Line Interface arguement');
}


const jsonFileName = soundFilePath+'-wave';

console.log('[log] jsonFileName is ', jsonFileName);

(async () => {

  console.log('[log] getting the length of the file');

  let {stdout:soundLengthInSec} = await exec(`mdls ${soundFilePath} | grep Duration | awk '{ print $3 }'`);

  soundLengthInSec = parseInt(soundLengthInSec.replace('/n',''));

  console.log('[log] The file length is ',soundLengthInSec);


  console.log(`[log] getting the sound wave and writing it to ${jsonFileName}.json`);

  await exec(`docker run --rm -v \`pwd\`:/tmp -w /tmp realies/audiowaveform  -i ${soundFilePath}  -o ${jsonFileName}.json`)

  console.log(`[log] trying to read the sound wave from ${soundFilePath} `);

  const jsonWave = fs.readFileSync(`${jsonFileName}.json`,'utf-8');

  console.log(`[log] succesfully opened ${jsonFileName}.json`);


  console.log(`[log] parsing the soundwave `)

  const sound = JSON.parse(jsonWave); 

  console.log(`[log] calculating the highest point in the waveform`);

  let viizualizeData = [];

  const videoLengthInSec = soundLengthInSec;

  const timeIntervalBetweenDataPoint = videoLengthInSec / sound.data.length;

  for (let i = 0; i < sound.data.length; i++) {

    viizualizeData.push({
        soundPoint: sound.data[i],
        timePoint: timeIntervalBetweenDataPoint * i
      }
    );

  }

  const r = viizualizeData.sort( (a,b) => a.soundPoint - b.soundPoint);

  const highestPoint = r[0];

  console.log(`[log] found the highest point `,highestPoint);


  const pathToSave = `./${soundFilePath.replace('/','').replace('.wav','').replace('.','')}-highest-point.json`;

  console.log(`[log] writing the result in ${pathToSave}`);


  fs.writeFileSync(pathToSave,JSON.stringify(highestPoint));


})().catch(console.log)


