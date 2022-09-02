const Student = require("../../models/studentModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const handleLogin = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: "Please enter all fields" });
    }
    const student = await Student.findOne({ username });
    if (!student) {
        return res.sendStatus(401); // unauthorized
    }
    const match = await bcrypt.compare(password, student.password);
    if (!match) {
        return res.sendStatus(401); // unauthorized
    }
    const accessToken = jwt.sign(
        {
            _id: student._id,
            name: student.name,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "300s" }
    );

    const refreshToken = jwt.sign(
        { username: student.username, _id: student._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "1d" }
    );
    await Student.findOneAndUpdate({ username }, { refreshToken: refreshToken });

    //cookie with refrest token
    res.cookie("jwt", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 24 * 60 * 60 * 1000,
    });

    //authorization with access token to student
    res.status(200).json({ name: student.name, accessToken, _id : student._id });
};

module.exports = { handleLogin };