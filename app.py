from flask import Flask, render_template
from data import timeline, favourites, hobbies

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/experience")
def experience():
    return render_template("experience.html", timeline=timeline)

@app.route("/favourites")
def favorites_page():
    return render_template("favourites.html", favourites=favourites, hobbies=hobbies)

if __name__ == "__main__":
    app.run(debug=True)