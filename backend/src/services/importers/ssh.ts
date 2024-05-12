import { NodeSSH } from 'node-ssh'
import ProgressLogger from '../../helpers/ProgressLogger'

export const newSSHConnection = async (host: string) => {
  return new NodeSSH().connect({
    host,
    username: 'lorenzo',
    privateKeyPath: '/home/lorenzo/Downloads/id_rsa_no_pass',
  })
}

/***
 * Safely download a file using SSH. Before calling this function it's advised to stop
 * services that might be accessing the file. This function will create a copy of the file
 * in the remote host before downloading it. After the copy is created, a callback will be
 * called to allow services to be safely re-started as soon as possible.
 *
 * The host MUST have enough disk to hold a copy of the file while it's being downloaded
 *
 * For example with pihole:
 *
 * - Stop pihole DNS service
 * - Call this function
 * - Re-start service when onSafeToUseFile
 * - Await for file to be downloaded
 *
 */
export const safeDownloadFile = async (options: {
  sshConnection: NodeSSH
  localPath: string
  remoteCopyPath: string
  remotePath: string
  onSafeToUseFile?: (() => Promise<void>) | (() => void)
}) => {
  const {
    sshConnection,
    localPath,
    remoteCopyPath,
    remotePath,
    onSafeToUseFile,
  } = options

  console.log('Copying remote file before downloading...')
  await sshConnection
    .execCommand(`cp ${remotePath} ${remoteCopyPath}`)
    .then((result) => {
      if (result.stdout) {
        console.log(`File copy stdout: ${result.stdout}`)
      }

      if (result.stderr) {
        console.log(`Error copying file: ${result.stderr}`)
      }
      console.log("Remote file copied, it's now safe to use the remote file...")
    })

  // I'd like to not have to await here, but I was getting weird SSH connection errors if I run sshConnection.execCommand
  // from within this callback. For the time being it's just easier to await
  await onSafeToUseFile?.()

  const progress = new ProgressLogger('SSH Download', { isFileSize: true })
  console.log('Downloading file using SSH')
  console.log('  - Remote path:', remoteCopyPath)
  console.log('  - Local path:', localPath)
  try {
    await sshConnection.getFile(localPath, remoteCopyPath, undefined, {
      step: (current, _chunk, total) => {
        progress.step(current, total)
      },
    })
  } catch (e) {
    console.log('Failed to download file')
  }
  progress.stop()
}
