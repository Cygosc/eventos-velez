// Compila la APK de depuración y la copia a dist/eventos-velez.apk
// Gradle compila en <disco del proyecto>:\AndroidBuild\CortesCABA (ver android/build.gradle): OneDrive bloquea
// los archivos temporales de la compilación si quedan dentro de la carpeta sincronizada.
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const raiz = path.join(__dirname, "..");
const buildDir = path.join(path.parse(raiz).root, "AndroidBuild", "CortesCABA");
const gradle = process.platform === "win32" ? `"${path.join(raiz, "android", "gradlew.bat")}"` : "./gradlew";
execSync(`${gradle} assembleDebug -q`, { cwd: path.join(raiz, "android"), stdio: "inherit", shell: true });
fs.mkdirSync(path.join(raiz, "dist"), { recursive: true });
fs.copyFileSync(path.join(buildDir, "app/outputs/apk/debug/app-debug.apk"), path.join(raiz, "dist/eventos-velez.apk"));
console.log("APK lista en dist/eventos-velez.apk");
