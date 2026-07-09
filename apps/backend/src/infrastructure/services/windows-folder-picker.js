const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

class WindowsFolderPicker {
  async pickFolder(options = {}) {
    const script = buildFolderPickerScript(options);
    const { stdout } = await execFileAsync(
      "powershell.exe",
      ["-NoProfile", "-STA", "-ExecutionPolicy", "Bypass", "-Command", script],
      {
        windowsHide: true,
        maxBuffer: 1024 * 1024,
      },
    );

    const selectedPath = String(stdout || "").trim();
    if (!selectedPath) {
      throw new Error("Klasor secimi iptal edildi.");
    }

    return selectedPath;
  }
}

function buildFolderPickerScript(options) {
  const initialPath = escapePowerShellString(options.initialPath || "");
  const description = escapePowerShellString(options.description || "Klasor secin");

  return [
    "Add-Type -AssemblyName System.Windows.Forms",
    "$dialog = New-Object System.Windows.Forms.FolderBrowserDialog",
    `$dialog.Description = '${description}'`,
    "$dialog.ShowNewFolderButton = $true",
    `if ('${initialPath}') { $dialog.SelectedPath = '${initialPath}' }`,
    "$result = $dialog.ShowDialog()",
    "if ($result -eq [System.Windows.Forms.DialogResult]::OK) {",
    "  [Console]::OutputEncoding = [System.Text.Encoding]::UTF8",
    "  Write-Output $dialog.SelectedPath",
    "}",
  ].join("; ");
}

function escapePowerShellString(value) {
  return String(value || "").replaceAll("'", "''");
}

module.exports = {
  WindowsFolderPicker,
};
