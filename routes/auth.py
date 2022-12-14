from flask import Blueprint, request, render_template, Response, redirect, url_for
from utils.users import login, verify, createUser
from utils.settings import getSetting
import time

auth = Blueprint("auth", __name__)

@auth.route("/login", methods=["GET", "POST"])
def login_():
    verified = verify(request)
    index = url_for("www.index")
    if verified: return redirect(index, code=302)

    if request.method == "GET":
        resp = Response(render_template("login.html", allowRegister=getSetting("registerPublic").lower() == "true", ref=request.headers.get("referer") if request.headers.get("referer") else index))

        if verified == False and "token" in request.cookies:
            resp.set_cookie("token", "", expires=0)

        return resp

    elif request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        if not username or not password: return render_template("login.html", allowRegister=getSetting("registerPublic").lower() == "true", msg="Please fill in all fields")

        logged = login(username, password)
        if not logged: return render_template("login.html", allowRegister=getSetting("registerPublic").lower() == "true", msg="Invalid username or password")
        ref = request.args.get("ref") if request.args.get("ref") else index
        if "logout" in ref: ref = index

        resp = redirect(ref)
        resp.set_cookie("token", logged, expires=int(time.time()) + (30 * 60 * 60 * 24))
        return resp

@auth.route("/create", methods=["GET", "POST"])
def create_():
    if request.method == "GET":
        return render_template("register.html", login=request.args.get("login", False))

    elif request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        email = request.form["email"]

        if not username or not password or not email: return render_template("register.html", msg="Please fill in all fields")

        createUser(
            username=username,
            password=password,
            email=email
        )

        if request.args.get("login") == "true":
            logged = login(username, password)
            resp = redirect("/")
            resp.set_cookie("token", logged, expires=int(time.time()) + (30 * 60 * 60 * 24))
            return resp

        return "<script>window.close();</script>"

@auth.route('/logout')
def logout():
    resp = Response(
        "<script>location='/';</script>"
    )
    resp.headers["Location"] = "/"
    resp.set_cookie("token", "", expires=0)
    resp.status_code = 302
    return resp