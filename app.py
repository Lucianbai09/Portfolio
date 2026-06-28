from flask import Flask, render_template
from data import timeline, favourites, hobbies

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/memories")
def memories():
    return render_template("memories.html", timeline=timeline)

@app.route("/identity")
def identity_page():
    return render_template("identity.html", favourites=favourites, hobbies=hobbies)

if __name__ == "__main__":
    app.run(debug=True)