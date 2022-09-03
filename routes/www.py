from flask import Blueprint, request, render_template, send_from_directory
from utils.paths import DB_FOLDER
from utils.settings import getSetting
import requests
import json
import os

www = Blueprint('www', __name__)
playlistFile = os.path.join(DB_FOLDER, "playlist.json")

@www.route('/')
def index():
    return render_template(
        'index.html',
        tab=request.args.get("tab") or "",
        id=request.args.get("id") or "",
        showG=request.args.get("showG") or "true",
        kind = request.args.get("kind") or "",
        showFt = request.args.get("showFt") or "true",
    )

@www.route('/play/<id>/<episode>')
@www.route('/play/<id>/', defaults={'episode': None})
@www.route('/play/<id>', defaults={'episode': None})
def play(id, episode):
    source = getSetting('source')
    if request.args.get('source'): source = request.args.get('source')
    baseURL = request.base_url.split('/play')[0]

    url = f"{baseURL}/api/resolve/{id}?source={source}"
    if episode: url += f"&episode={episode}"
    ep = "0"
    se = "0"
    if episode:
        ep = episode.split("-")[1]
        se = episode.split("-")[0]

    resolved = requests.get(url).json()["url"]
    return render_template('play.html', resolved=resolved, ep=ep, id=id, se=se)


@www.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)
