import * as readline from 'node:readline'
import { NodeSSH } from 'node-ssh'
import humanFileSize from '../helpers/humanFileSize'

export const newSSHConnection = async (host: string) => {
  return new NodeSSH().connect({
    host,
    username: 'lorenzo',
    privateKeyPath: '/home/lorenzo/Downloads/id_rsa_no_pass',
  })
}

export const downloadFile = async (
  sshConnection: NodeSSH,
  localPath: string,
  remotePath: string
) => {
  await sshConnection.getFile(localPath, remotePath, undefined, {
    tick: (localPath, remotePath, error) => {
      if (error) {
        console.log('SSH failed to download file:', error)
        return
      }
      console.log(
        `SSH file successfully downloaded. From remote "${remotePath}" to local "${localPath}"`
      )
    },
    step: (total_transferred, _chunk, total) => {
      readline.clearLine(process.stdout, 0)
      readline.cursorTo(process.stdout, 0)
      process.stdout.write(
        `Downloaded ${humanFileSize(total_transferred)} of ${humanFileSize(
          total
        )}`
      )
    },
  })
  console.log()
}
