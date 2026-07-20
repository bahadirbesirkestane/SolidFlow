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

    return String(stdout || "").trim();
  }
}

function buildFolderPickerScript(options) {
  const initialPath = escapePowerShellString(options.initialPath || "");
  const description = escapePowerShellString(options.description || "Klasor secin");

  return [
    "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8",
    "$selectedPath = $null",
    "try {",
    "$source = @'",
    "using System;",
    "using System.Runtime.InteropServices;",
    "",
    "[ComImport, Guid(\"DC1C5A9C-E88A-4DDE-A5A1-60F82A20AEF7\")]",
    "public class FileOpenDialog { }",
    "",
    "[Flags]",
    "public enum FOS : uint {",
    "  FOS_NOCHANGEDIR = 0x00000008,",
    "  FOS_PICKFOLDERS = 0x00000020,",
    "  FOS_FORCEFILESYSTEM = 0x00000040,",
    "  FOS_PATHMUSTEXIST = 0x00000800",
    "}",
    "",
    "public enum SIGDN : uint {",
    "  SIGDN_FILESYSPATH = 0x80058000",
    "}",
    "",
    "[ComImport, InterfaceType(ComInterfaceType.InterfaceIsIUnknown), Guid(\"43826D1E-E718-42EE-BC55-A1E261C37BFE\")]",
    "public interface IShellItem {",
    "  void BindToHandler(IntPtr pbc, ref Guid bhid, ref Guid riid, out IntPtr ppv);",
    "  void GetParent(out IShellItem ppsi);",
    "  void GetDisplayName(SIGDN sigdnName, out IntPtr ppszName);",
    "  void GetAttributes(uint sfgaoMask, out uint psfgaoAttribs);",
    "  void Compare(IShellItem psi, uint hint, out int piOrder);",
    "}",
    "",
    "[ComImport, InterfaceType(ComInterfaceType.InterfaceIsIUnknown), Guid(\"42F85136-DB7E-439C-85F1-E4075D135FC8\")]",
    "public interface IFileOpenDialog {",
    "  [PreserveSig] int Show(IntPtr parent);",
    "  void SetFileTypes(uint cFileTypes, IntPtr rgFilterSpec);",
    "  void SetFileTypeIndex(uint iFileType);",
    "  void GetFileTypeIndex(out uint piFileType);",
    "  void Advise(IntPtr pfde, out uint pdwCookie);",
    "  void Unadvise(uint dwCookie);",
    "  void SetOptions(FOS fos);",
    "  void GetOptions(out FOS pfos);",
    "  void SetDefaultFolder(IShellItem psi);",
    "  void SetFolder(IShellItem psi);",
    "  void GetFolder(out IShellItem ppsi);",
    "  void GetCurrentSelection(out IShellItem ppsi);",
    "  void SetFileName([MarshalAs(UnmanagedType.LPWStr)] string pszName);",
    "  void GetFileName([MarshalAs(UnmanagedType.LPWStr)] out string pszName);",
    "  void SetTitle([MarshalAs(UnmanagedType.LPWStr)] string pszTitle);",
    "  void SetOkButtonLabel([MarshalAs(UnmanagedType.LPWStr)] string pszText);",
    "  void SetFileNameLabel([MarshalAs(UnmanagedType.LPWStr)] string pszLabel);",
    "  void GetResult(out IShellItem ppsi);",
    "  void AddPlace(IShellItem psi, int fdap);",
    "  void SetDefaultExtension([MarshalAs(UnmanagedType.LPWStr)] string pszDefaultExtension);",
    "  void Close(int hr);",
    "  void SetClientGuid(ref Guid guid);",
    "  void ClearClientData();",
    "  void SetFilter(IntPtr pFilter);",
    "  void GetResults(out IntPtr ppenum);",
    "  void GetSelectedItems(out IntPtr ppsai);",
    "}",
    "",
    "public static class ModernFolderPicker {",
    "  [DllImport(\"shell32.dll\", CharSet = CharSet.Unicode, PreserveSig = false)]",
    "  private static extern void SHCreateItemFromParsingName(string pszPath, IntPtr pbc, ref Guid riid, out IShellItem ppv);",
    "",
    "  [DllImport(\"ole32.dll\")]",
    "  private static extern void CoTaskMemFree(IntPtr pv);",
    "",
    "  public static string Pick(string title, string initialPath) {",
    "    IFileOpenDialog dialog = (IFileOpenDialog)new FileOpenDialog();",
    "    FOS options;",
    "    dialog.GetOptions(out options);",
    "    dialog.SetOptions(options | FOS.FOS_PICKFOLDERS | FOS.FOS_FORCEFILESYSTEM | FOS.FOS_PATHMUSTEXIST | FOS.FOS_NOCHANGEDIR);",
    "    dialog.SetTitle(title);",
    "    dialog.SetOkButtonLabel(\"Klasor Sec\");",
    "",
    "    if (!String.IsNullOrWhiteSpace(initialPath) && System.IO.Directory.Exists(initialPath)) {",
    "      Guid shellItemGuid = typeof(IShellItem).GUID;",
    "      IShellItem initialFolder;",
    "      SHCreateItemFromParsingName(initialPath, IntPtr.Zero, ref shellItemGuid, out initialFolder);",
    "      dialog.SetFolder(initialFolder);",
    "    }",
    "",
    "    int result = dialog.Show(IntPtr.Zero);",
    "    if (result != 0) {",
    "      return null;",
    "    }",
    "",
    "    IShellItem item;",
    "    dialog.GetResult(out item);",
    "    IntPtr pathPtr;",
    "    item.GetDisplayName(SIGDN.SIGDN_FILESYSPATH, out pathPtr);",
    "    try {",
    "      return Marshal.PtrToStringUni(pathPtr);",
    "    } finally {",
    "      CoTaskMemFree(pathPtr);",
    "    }",
    "  }",
    "}",
    "'@",
    "Add-Type -TypeDefinition $source",
    `$selectedPath = [ModernFolderPicker]::Pick('${description}', '${initialPath}')`,
    "} catch {",
    "  Add-Type -AssemblyName System.Windows.Forms",
    "  $dialog = New-Object System.Windows.Forms.FolderBrowserDialog",
    `$dialog.Description = '${description}'`,
    "  $dialog.ShowNewFolderButton = $true",
    `  if ('${initialPath}' -and [System.IO.Directory]::Exists('${initialPath}')) { $dialog.SelectedPath = '${initialPath}' }`,
    "  $result = $dialog.ShowDialog()",
    "  if ($result -eq [System.Windows.Forms.DialogResult]::OK) { $selectedPath = $dialog.SelectedPath }",
    "}",
    "if ($selectedPath) { Write-Output $selectedPath }",
  ].join("\n");
}

function escapePowerShellString(value) {
  return String(value || "").replaceAll("'", "''");
}

module.exports = {
  WindowsFolderPicker,
};
