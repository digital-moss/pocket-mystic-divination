import os
import time
import urllib.request

original_urls = [
    "https://upload.wikimedia.org/wikipedia/commons/9/90/Rider-Waite-Tarot-00-Fool.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/d/de/Rider-Waite-Tarot-01-Magician.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/8/88/Rider-Waite-Tarot-02-HighPriestess.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/d/d2/Rider-Waite-Tarot-03-Empress.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/c/c3/Rider-Waite-Tarot-04-Emperor.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/8/8d/Rider-Waite-Tarot-05-Hierophant.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/d/db/Rider-Waite-Tarot-06-Lovers.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/9/9b/Rider-Waite-Tarot-07-Chariot.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/f/f5/Rider-Waite-Tarot-08-Strength.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/4/4d/Rider-Waite-Tarot-09-Hermit.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/3/3c/Rider-Waite-Tarot-10-WheelOfFortune.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/e/e0/Rider-Waite-Tarot-11-Justice.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/2/2b/Rider-Waite-Tarot-12-HangedMan.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/d/d7/Rider-Waite-Tarot-13-Death.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/f/f8/Rider-Waite-Tarot-14-Temperance.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/5/55/Rider-Waite-Tarot-15-Devil.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/5/53/Rider-Waite-Tarot-16-Tower.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/d/db/Rider-Waite-Tarot-17-Star.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/7/7f/Rider-Waite-Tarot-18-Moon.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/1/17/Rider-Waite-Tarot-19-Sun.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/d/dd/Rider-Waite-Tarot-20-Judgement.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/f/ff/Rider-Waite-Tarot-21-World.jpg"
]

web_dir = "public/tarot"
android_dir = "android-app/app/src/main/assets/tarot"

os.makedirs(web_dir, exist_ok=True)
os.makedirs(android_dir, exist_ok=True)

headers = {'User-Agent': 'PocketMysticApp/2.0 (Educational Tarot Project; contact@pocketmystic.app)'}

for i, url in enumerate(urls := original_urls):
    parts = url.split('/')
    filename = f"{i:02d}_{parts[-1].lower()}"
    # Construct thumbnail URL according to Wikimedia Commons guidelines:
    # e.g., https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Rider-Waite-Tarot-00-Fool.jpg/800px-Rider-Waite-Tarot-00-Fool.jpg
    sub1 = parts[4]
    sub2 = parts[5]
    orig_name = parts[6]
    thumb_url = f"https://upload.wikimedia.org/wikipedia/commons/thumb/{sub1}/{sub2}/{orig_name}/800px-{orig_name}"
    
    web_path = os.path.join(web_dir, filename)
    android_path = os.path.join(android_dir, filename)
    
    print(f"Downloading card {i}: {thumb_url} -> {filename}")
    try:
        req = urllib.request.Request(thumb_url, headers=headers)
        with urllib.request.urlopen(req) as response:
            data = response.read()
            with open(web_path, "wb") as f:
                f.write(data)
            with open(android_path, "wb") as f:
                f.write(data)
        print(f"Successfully downloaded {filename}")
    except Exception as e:
        print(f"Failed to download {thumb_url}: {e}")
        # Fallback to original url if thumb failed
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req) as response:
                data = response.read()
                with open(web_path, "wb") as f:
                    f.write(data)
                with open(android_path, "wb") as f:
                    f.write(data)
            print(f"Successfully downloaded via fallback {filename}")
        except Exception as e2:
            print(f"Fallback also failed for {url}: {e2}")
    time.sleep(0.8)
