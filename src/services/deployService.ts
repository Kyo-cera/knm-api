import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

class DeployService {
    public async deployBE(): Promise<void> {
        try {
            const scriptPath = path.resolve(__dirname, '../../../deploy/deployBE.ps1');
            const command = `powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}"`;
            
            const { stdout, stderr } = await execAsync(command);
            console.log('Deploy output :', stdout);
            
            if (stderr) {
                console.error('Deploy errors:', stderr);
                throw new Error(stderr);
            }
        } catch (error) {
            console.error('Deploy failed:', error);
            throw error;
        }
    }

    public async deployFE(): Promise<void> {
        try {
            const scriptPath = path.resolve(__dirname, '../../../deploy/deployFE.ps1');
            const command = `powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}"`;
            
            const { stdout, stderr } = await execAsync(command);
            console.log('Deploy output:', stdout);
            
            if (stderr) {
                console.error('Deploy errors:', stderr);
                throw new Error(stderr);
            }
        } catch (error) {
            console.error('Deploy failed:', error);
            throw error;
        }
    }
}

export default new DeployService();
