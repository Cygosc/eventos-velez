// Compila la APK de depuración y la copia a dist/eventos-velez.apk
// La compilación se hace fuera de la carpeta del proyecto (OneDrive bloquea los archivos temporales de Gradle).
const { execSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const raiz = path.join(__dirname, "..");
const buildDir = path.join(process.env.LOCALAPPDATA || os.tmpdir(), "eventos-velez-build");
const gradle = process.platform === "win32" ? `"${path.join(raiz, "android", "gradlew.bat")}"` : "./gradlew";
execSync(`${gradle} assembleDebug -q`, {
  cwd: path.join(raiz, "android"),
  stdio: "inherit",
  shell: true,
  env: { ...process.env, EVENTOS_BUILD_DIR: buildDir },
});
fs.mkdirSync(path.join(raiz, "dist"), { recursive: true });
fs.copyFileSync(path.join(buildDir, "app/outputs/apk/debug/app-debug.apk"), path.join(raiz, "dist/eventos-velez.apk"));
console.log("APK lista en dist/eventos-velez.apk");
