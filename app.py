from flask import Flask, render_template
from data import projects, achievements, hobbies, favorites

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("home.html")

@app.route("/projects")
def projects_page():
    return render_template("projects.html", projects=projects)

@app.route("/achievements")
def achievements_page():
    return render_template("achievements.html", achievements=achievements)

@app.route("/hobbies")
def hobbies_page():
    return render_template("hobbies.html", hobbies=hobbies)

@app.route("/favorites")
def favorites_page():
    return render_template("favorites.html", favorites=favorites)

if __name__ == "__main__":
    app.run(debug=True)