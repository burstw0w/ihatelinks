import sys
import os
import instaloader

# Suppress all warnings/errors to stderr
sys.stderr = open(os.devnull, 'w')

SESSION_ID = "INSERT_SESSION_HERE"

url = sys.argv[1]

L = instaloader.Instaloader(quiet=True)
L.context._session.cookies.set("sessionid", SESSION_ID, domain=".instagram.com")

if "/p/" in url:
    shortcode = url.split("/p/")[-1].split("/")[0].split("?")[0]
elif "/reel/" in url:
    shortcode = url.split("/reel/")[-1].split("/")[0].split("?")[0]
elif "/tv/" in url:
    shortcode = url.split("/tv/")[-1].split("/")[0].split("?")[0]
else:
    print("ERROR: Unsupported URL")
    sys.exit(1)

post = instaloader.Post.from_shortcode(L.context, shortcode)

if post.typename == "GraphSidecar":
    for node in post.get_sidecar_nodes():
        print(node.video_url if node.is_video else node.display_url)
elif post.is_video:
    print(post.video_url)
else:
    print(post.url)

