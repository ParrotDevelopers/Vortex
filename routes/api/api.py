from flask import Blueprint, jsonify, Response, redirect, request, send_from_directory
from utils.settings import getSetting
import plugins.imdb as imdb
import requests
import shutil
import base64
import psutil
import json
import random
from utils.paths import DB_FOLDER, POSTER_FOLDER
from utils.cache import getCachedItem, cacheItem, getCacheSize, clearCache
from utils.fakeBrowser import baseHeaders
from utils.common import randStr, chunkedDownload
import os

api = Blueprint('api', __name__)
cachePosters = getSetting('cachePosters').lower() == "true"
favoritesFile = os.path.join(DB_FOLDER, "favorites.json")
playlistFile = os.path.join(DB_FOLDER, "playlist.json")
homeMenuFile = os.path.join(DB_FOLDER, "homeMenu.json")


@api.route('/')
def index():
    return jsonify({
        'status': 'ok',
        'message': 'API Running'
    })

featuredMovies = {
    "Joker": {
        "img": "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fimages.wallpapersden.com%2Fimage%2Fdownload%2Fjoker-2019-movie-poster_66602_2560x1440.jpg&f=1&nofb=1",
        "title": "JOKER",
        "line": "SMILE AND PUT ON A HAPPY FACE",
        "info": "8.4/10\u00A0\u00A02019\u00A0\u00A0Crime, Drama, Thriller\u00A0\u00A02h 20m",
        "plot": "A socially inept clown for hire - Arthur Fleck aspires to be a stand up comedian among his small job working dressed as a clown holding a sign for advertising. He takes care of his mother- Penny Fleck, and as he learns more about his mental illness, he learns more about his past. Dealing with all the negativity and bullying from society he heads downwards on a spiral, in turn showing how his alter ego \"Joker\", came to be.",
		"imdbID": "tt7286456",
		"kind": "movie",
    },
    #"BatmanTDK": {
    #    "img": "https://external-content.duckduckgo.com/iu/?u=http%3A%2F%2Fgetwallpapers.com%2Fwallpaper%2Ffull%2F0%2F1%2F4%2F312259.jpg&f=1&nofb=1",
    #    "title": "The Dark Knight",
    #    "line": "WHY SO SERIOUS?",
    #    "info": "9.0/10\u00A0\u00A02008\u00A0\u00A0Action, Crime, Drama\u00A0\u00A02h 32m",
    #    "plot": "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
    #    "imdbID": "tt0468569",
	#	"kind": "movie",
    #}
}

@api.route('/featured')
def featured():
    if not os.path.exists(favoritesFile): open(favoritesFile, "w").write("{}")
    if not os.path.exists(playlistFile): open(playlistFile, "w").write("{}")
    favorites = json.loads(open(favoritesFile, "r").read())
    playlist = json.loads(open(playlistFile, "r").read())
    ft = random.choice(list(featuredMovies.values()))
    ft["inPlaylist"] = ft["imdbID"].replace("tt", "") in playlist or False
    ft["inFavorites"] = ft["imdbID"].replace("tt", "") in favorites or False
    return ft

def initHomeMenu():
    menu = {
		randStr(10): {
			"title": "Action",
			"url": "/api/getMoviesByGenres?genres=Action",
		},
		randStr(10): {
			"title": "Adventure",
			"url": "/api/getMoviesByGenres?genres=Adventure",
		},
		randStr(10): {
			"title": "War",
			"url": "/api/getMoviesByGenres?genres=War",
		},
        randStr(10): {
			"title": "History",
			"url": "/api/getMoviesByGenres?genres=History",
		},
        randStr(10): {
			"title": "Western",
			"url": "/api/getMoviesByGenres?genres=Western",
		},
	}
    open(homeMenuFile, "w").write(json.dumps(menu, indent=4))

@api.route('/homeMenu')
def homeMenu():
    if not os.path.exists(homeMenuFile): initHomeMenu()
    return json.load(open(homeMenuFile, 'r'))

@api.route('/sysinfo')
def sysinfo():
    return jsonify({
        'status': 'ok',
        'systemRAMUsage': f"{psutil.virtual_memory().percent}%",
        'pythonCPUUsage': f"{psutil.cpu_percent()}%",
        'cache': getCacheSize(),
        'version': open('VERSION', 'r').read()
    })

@api.route('/resolve/<id>')
@api.route('/resolve/', defaults={'id': None})
def resolve(id):
    if not id: return jsonify({
        'status': 'error',
        'message': 'No ID provided'
    })
    if not id.startswith("tt"): id = f"tt{id}"
    use = getSetting("source")
    if request.args.get("source"): use = request.args.get("source")
    episode = str(request.args.get("episode") or "")
    baseURL = request.base_url.split("/api")[0]
    url = f"{baseURL}/proxy/{use}/play?item={id}"
    if episode: url += f"&episode={episode}"
    return jsonify({
        "id": id,
        "url": requests.get(url).text,
        "poster": "/static/img/preloader/1.png"
    })

@api.route('/sources/<id>')
@api.route('/sources/', defaults={'id': None})
def sources(id):
    if not id: return jsonify({
        'status': 'error',
        'message': 'No ID provided'
    })

    tp = request.args.get("type")
    if not tp: return jsonify({
        'status': 'error',
        'message': 'No Type provided'
    })
    ep = request.args.get("ep")
    sources = [
        "gomo",
        "vidsrc",
        "vidembed",
        "kukajto"
    ]

    default = getSetting("source")
    if request.args.get("default"): default = request.args.get("default")
    sources.insert(0, sources.pop(sources.index(default)))

    response = []
    for src in sources:
        j = {"title": src,}
        j["file"] = f"/play/{id}/{ep}.m3u8" if tp == "show" else f"/play/{id}.m3u8"
        j["file"] += f"?source={src}"
        response.append(j)
    return response



@api.route('/poster/<id>')
@api.route('/poster/', defaults={'id': None})
def poster(id):
    if not id: return jsonify({
        'status': 'error',
        'message': 'No ID provided'
    })
    if id.startswith("tt"): id = id[2:]
    do = request.args.get('do', None)
    baseURL = request.base_url.split('/api')[0]
    posterURL = imdb.IMDBtoPoster(id)
    if not posterURL: posterURL = f"{baseURL}/static/img/nopicture.jpg"
    if do == 'redirect': return redirect(posterURL)
    elif do == 'show':
        if not os.path.exists(POSTER_FOLDER): os.makedirs(POSTER_FOLDER)
        if not cachePosters or "nopicture" in posterURL: return Response(requests.get(posterURL).content, mimetype="image/jpeg")
        if f"tt{id}.png" not in os.listdir(POSTER_FOLDER):
            chunkedDownload(posterURL, os.path.join(POSTER_FOLDER, f"tt{id}.png"))
        return send_from_directory(POSTER_FOLDER, f"tt{id}.png")
    return jsonify({
        "id": id,
        "url": posterURL
    })

@api.route('/search/<query>')
@api.route('/search/', defaults={'query': None})
def search(query):
    if not query: return jsonify({
        'status': 'error',
        'message': 'No query provided'
    })
    cached = getCachedItem(f"search-query-{query.replace(' ', '---')}.json", "search")
    if cached == None:
        results = imdb.search(query)
        cacheItem(f"search-query-{query.replace(' ', '---')}.json", "search", json.dumps(results))
        return jsonify({
            "query": query,
            "results": results
        })
    #print(f"Returning cached search results for \"{query}\"")
    return jsonify({
        "query": query,
        "results": json.loads(cached)
    })

@api.route('/seasons/<id>')
@api.route('/seasons/', defaults={'id': None})
def seasons(id):
    if not id: return jsonify({
        'status': 'error',
        'message': 'No ID provided'
    })
    if id.startswith("tt"): id = id[2:]
    cached = getCachedItem(f"seasons-{id}.json", "seasons")
    if cached == None:
        results = imdb.seasons(id)
        cacheItem(f"seasons-{id}.json", "seasons", json.dumps(results))
        return jsonify({
            "id": id,
            "results": results
        })
    #print(f"Returning cached seasons for \"{id}\"")
    return jsonify({
        "id": id,
        "results": json.loads(cached)
    })

@api.route('/episodes/<id>/<season>')
@api.route('/episodes/', defaults={'id': None, 'season': None})
def episodes(id, season):
    if not id: return jsonify({
        'status': 'error',
        'message': 'No ID provided'
    })
    if season == None: return jsonify({
        'status': 'error',
        'message': 'No season provided'
    })
    if id.startswith("tt"): id = id[2:]
    if not season: return jsonify({
        'status': 'error',
        'message': 'No season provided'
    })
    cached = getCachedItem(f"episodes-{id}-{season}.json", "episodes")
    if cached == None:
        results = imdb.episodes(id, season)
        cacheItem(f"episodes-{id}-{season}.json", "episodes", json.dumps(results))
        return jsonify({
            "id": id,
            "season": season,
            "results": results
        })
    #print(f"Returning cached episodes for \"{id}\"")
    return jsonify({
        "id": id,
        "season": season,
        "results": json.loads(cached)
    })

@api.route('/episodeCount/<id>')
@api.route('/episodeCount/', defaults={'id': None})
def episodeCount(id):
    if not id: return jsonify({
        'status': 'error',
        'message': 'No ID provided'
    })
    if id.startswith("tt"): id = id[2:]
    cached = getCachedItem(f"episodeCount-{id}.json", "episodeCounts")
    if cached == None:
        results = imdb.allEpisodesCount(id)
        cacheItem(f"episodeCount-{id}.json", "episodeCounts", json.dumps(results))
        return jsonify({
            "id": id,
            "results": results
        })
    return jsonify({
        "id": id,
        "results": json.loads(cached)
    })

@api.route('/top250movies/')
def top250movies():
    cached = getCachedItem("top250movies.json", "imdbCache")
    if cached == None:
        results = imdb.top250movies()
        cacheItem("top250movies.json", "imdbCache", json.dumps(results))
        return jsonify({
            "results": results
        })
    #print("Returning cached top250movies.json")
    return jsonify({
        "results": json.loads(cached)
    })

@api.route('/bottom100movies/')
def bottom100movies():
    cached = getCachedItem("bottom100movies.json", "imdbCache")
    if cached == None:
        results = imdb.bottom100movies()
        cacheItem("bottom100movies.json", "imdbCache", json.dumps(results))
        return jsonify({
            "results": results
        })
    #print("Returning cached bottom100movies.json")
    return jsonify({
        "results": json.loads(cached)
    })

@api.route('/getMoviesByGenres')
def getMoviesByGenres():
    genres = request.args.get("genres")
    MAX_RESULTS = 30
    if not genres: return jsonify({
        "status": "error"
    })
    if "|" in genres: genres = genres.split("|")
    else: genres = [genres]

    cached = getCachedItem("-".join(genres) + ".json", "genres")
    if cached == None:
        results = imdb.getMoviesByGenres(genres)
        cacheItem("-".join(genres) + ".json", "genres", json.dumps(results))
        return jsonify({
            "results": dict(list(results.items())[:MAX_RESULTS])
        })
    return jsonify({
        "results": dict(list(json.loads(cached).items())[:MAX_RESULTS])
    })

@api.route('/clearPosterCache/')
def clearPosterCache():
    fileCount = len(os.listdir(POSTER_FOLDER))
    if fileCount == 0: return jsonify({
        'status': 'error',
        'message': 'No posters found'
    })
    shutil.rmtree(POSTER_FOLDER)
    os.makedirs(POSTER_FOLDER)
    return jsonify({
        "status": "ok",
        "message": "Poster cache cleared",
        "filesDeleted": fileCount
    })

@api.route('/clearCache/')
def clearCache_():
    fileCount = clearCache()
    if fileCount == 0: return jsonify({
        'status': 'error',
        'message': 'No files / folders found'
    })
    return jsonify({
        "status": "ok",
        "message": "Cache cleared",
        "filesDeleted": fileCount
    })

@api.route('/proxy/<path:url>')
def proxy(url):
    if url.startswith("base64:"): url = base64.b64decode(url[7:]).decode("utf-8")
    headers = baseHeaders
    if request.args.get("headers"): headers.update(json.loads(base64.b64decode(request.args.get("headers")).decode('utf-8')))
    r = requests.get(url, headers=headers, stream=True)
    return Response(r.iter_content(chunk_size=10*1024), content_type=r.headers['Content-Type'])

@api.route('/mergeShows.m3u')
def mergeShowM3Us():
    baseURL = request.base_url.split("/api")[0]
    items = request.args.get("ids")
    if "|" in items: items = items.split("|")
    else: items = [items]
    m3u = "#EXTM3U\n"
    for id in items: m3u += requests.get(f"{baseURL}/show/{id}.m3u").text.replace("#EXTM3U\n", "")
    return Response(m3u, mimetype="audio/x-mpegurl")

@api.route('/getMovieInfo/<id>')
@api.route('/getMovieInfo/', defaults={'id': None})
def getMovieInfo(id):
    baseURL = request.base_url.split("/api")[0]
    if not os.path.exists(favoritesFile): open(favoritesFile, "w").write("{}")
    if not os.path.exists(playlistFile): open(playlistFile, "w").write("{}")
    if not id: return jsonify({
        'status': 'error',
        'message': 'No ID provided'
    })
    if id.startswith("tt"): id = id[2:]
    if id == "undefined": return "Error"
    favorites = json.loads(open(favoritesFile, "r").read())
    playlist = json.loads(open(playlistFile, "r").read())
    rp = "" # response
    cached = getCachedItem(f"Item-{id}.json", "ItemInfoCache")
    if cached == None:
        movie = imdb.getMovieInfo(id)
        resp = {}
        resp["title"] = movie['title']
        resp["plot"] = movie['plot'][0]
        resp["poster"] = movie["full-size cover url"]
        resp["year"] = movie['year']
        resp["genres"] = ", ".join(movie['genres'][0:3])
        resp["episodeCount"] = "0"

        # Get info that might / might not be in imdb's database
        try: resp["airDate"] = movie['original air date']
        except: resp["airDate"] = "N/A"
        try: resp["rating"] = round(float(movie['rating']), 1)
        except: resp["rating"] = "N/A"
        try: resp["budget"] = movie["box office"]['Budget']
        except: resp["budget"] = "N/A"

        # Create line with informations about movie, \u00A0 is unicode for space in JS
        resp["info"] = f"{resp['rating']}/10\u00A0\u00A0{resp['year']}\u00A0\u00A0{resp['genres']}\u00A0\u00A0"
        
        # Add data based on if its movie / tv show
        if "number of seasons" in movie:
            resp["kind"] = "show"
            resp["NOS"] = movie["number of seasons"]
            resp["episodeCount"] = requests.get(f"{baseURL}/api/episodeCount/{id}").json()["results"]
            resp["info"] += f"{resp['NOS']} Seasons"
        else: 
            resp["kind"] = "movie"
            resp["info"] += "0h 0m"

        cacheItem(f"Item-{id}.json", "ItemInfoCache", json.dumps(resp))
        rp = resp
    else: rp = json.loads(cached)
    rp["inFavorites"] = id in favorites or False
    rp["inPlaylist"] = id in playlist or False
    return jsonify(rp)

@api.route('/getEpisodeInfo/<id>/<season>-<episode>')
@api.route('/getEpisodeInfo/', defaults={'id': None})
def getEpisodeInfo(id, season, episode):
    if not id: return jsonify({
        'status': 'error',
        'message': 'No ID provided'
    })
    if id.startswith("tt"): id = id[2:]
    epID = ""
    sID = ""
    if len(episode) == 1: epID = "0" + episode
    if len(season) == 1: sID = "0" + season
    cached = getCachedItem(f"Episode-{id}-{sID}-{epID}.json", "EpisodeInfoCache")
    if cached == None:
        show, episode = imdb.getEpisodeInfo(id, season, episode)
        resp = {}
        resp["title"] = f"S{sID}E{epID} - {episode['title']}"
        resp["plot"] = episode['plot'].replace("\n", "").replace("    ", "")
        resp["poster"] = request.base_url.split("/getEpisodeInfo")[0] + f"/poster/{id}?do=show"
        resp["year"] = episode['year']
        resp["genres"] = ", ".join(show['genres'])
        resp["rating"] = round(float(episode['rating']), 1)
        try: resp["airDate"] = show['original air date']
        except: resp["airDate"] = "N/A"
        try: resp["budget"] = show["box office"]['Budget']
        except: resp["budget"] = "N/A"
        cacheItem(f"Episode-{id}-{sID}-{epID}.json", "EpisodeInfoCache", json.dumps(resp))
        return jsonify(resp)
    return json.loads(cached)