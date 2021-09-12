let ffprobePath:string = ""

import * as ffprobe from 'node-ffprobe-installer'

import * as execa from 'execa'
import * as isStream from 'is-stream'
import { Readable as ReadableStream } from 'stream'

import * as fs from 'fs'


const getFFprobeWrappedExecution = (
  input: string | ReadableStream
): execa.ExecaChildProcess => {
  const params = [
    '-v',
    'error',
    '-select_streams',
    'a:0',
    '-show_format',
    '-show_streams',
  ]

  /* Workaround for asar path problem for ffmpeg.
   *
   */
  if (ffprobePath == "") {
    if (ffprobe.path.indexOf('app.asar')>=0) {
      const ffprobePathUnpacked = ffprobe.path.replace('app.asar', 'app.asar.unpacked')
      if (fs.existsSync(ffprobePathUnpacked)) {
        ffprobePath = ffprobePathUnpacked
      }
    }
    if (ffprobePath == "") {
	ffprobePath = ffprobe.path
    } 
  }

  if (typeof input === 'string') {
    return execa(ffprobePath, [...params, input])
  }

  if (isStream(input)) {

    return execa(ffprobePath, [...params, '-i', 'pipe:0'], {
      reject: false,
      input,
    })
  }

  throw new Error('Given input was neither a string nor a Stream')
}

/**
 * Returns a promise that will be resolved with the duration of given audio in
 * seconds.
 *
 * @param  {string|ReadableStream} input Stream or path to file to be used as
 * input for `ffprobe`.
 *
 * @return {Promise} Promise that will be resolved with given audio duration in
 * seconds.
 */
const getAudioDurationInSeconds = async (
  input: string | ReadableStream
): Promise<number> => {
  const { stdout } = await getFFprobeWrappedExecution(input)
  const matched = stdout.match(/duration="?(\d*\.\d*)"?/)
  if (matched && matched[1]) return parseFloat(matched[1])
  throw new Error('No duration found!')
}

export default getAudioDurationInSeconds
export { getAudioDurationInSeconds }
