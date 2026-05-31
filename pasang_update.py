import os
import shutil
import subprocess

# Paths
react_dir = r"c:\Users\amich\Downloads\riceflow-enterprise (3)\riceflow-enterprise.3-main\riceflow-enterprise.3-main"
# Sync folders
sync_dirs = [
    r"c:\Users\amich\Downloads\riceflow-enterprise (3)\new\BumiMasApp\web",
    r"c:\Users\amich\Downloads\riceflow-enterprise (3)\WEIGHBRIDGE_FOR_USB\web"
]


def run():
    print("--- MEMULAI UPDATE APLIKASI RICEFLOW ---")
    
    # 1. Build React App
    print(f"\n1. Membangun (Building) React App di: {react_dir}")
    os.chdir(react_dir)
    try:
        subprocess.run(["npm", "run", "build"], check=True, shell=True)
    except subprocess.CalledProcessError:
        print("❌ GAGAL: Error saat menjalankan npm run build.")
        return

    # 2. Sync to Electron web folder
    dist_dir = os.path.join(react_dir, "dist")
    
    for electron_web_dir in sync_dirs:
        print(f"\n2. Menyalin file ke folder: {electron_web_dir}")
        
        if not os.path.exists(dist_dir):
            print("❌ GAGAL: Folder dist tidak ditemukan. Pastikan build berhasil.")
            return

        # Clear existing web folder content
        if os.path.exists(electron_web_dir):
            for filename in os.listdir(electron_web_dir):
                file_path = os.path.join(electron_web_dir, filename)
                try:
                    if os.path.isfile(file_path) or os.path.islink(file_path):
                        os.unlink(file_path)
                    elif os.path.isdir(file_path) and filename != "assets_old":
                        shutil.rmtree(file_path)
                except Exception as e:
                    print(f"Gagal menghapus {file_path}: {e}")
        else:
            os.makedirs(electron_web_dir)

        # Copy new dist content
        for item in os.listdir(dist_dir):
            s = os.path.join(dist_dir, item)
            d = os.path.join(electron_web_dir, item)
            if os.path.isdir(s):
                shutil.copytree(s, d, dirs_exist_ok=True)
            else:
                shutil.copy2(s, d)


    print("\n--- ✅ UPDATE BERHASIL! ---")
    print("Silakan buka aplikasi Windows Anda (BumiMasApp.exe atau npm start di folder app).")

if __name__ == "__main__":
    run()
