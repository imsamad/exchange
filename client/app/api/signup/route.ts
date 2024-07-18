import { pgPool } from "@/app/pg";
import * as bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    let { email, password } = body;
    if (!email || !password)
      return NextResponse.json(
        { message: "provide email and password" },
        {
          status: 404,
        }
      );

    const data = await pgPool.query(`SELECT * FROM "users" where email=$1`, [
      email,
    ]);

    if (data.rowCount) {
      return NextResponse.json(
        { message: "user already exist" },
        {
          status: 404,
        }
      );
    }

    const salt = await bcrypt.genSalt(10);

    password = bcrypt.hashSync(password, salt);

    let query = `INSERT INTO "users" (email, password,role) VALUES ($1, $2, $3)  RETURNING *`;

    let values = [email, password, "user"];

    let res = await pgPool.query(query, values);

    const jwtToken = jwt.sign(
      { id: res.rows[0].user_id },
      process.env.JWT_SECRET as string
    );

    await fetch(`${process.env.API_URL}/onramp`, {
      method: "post",
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
    });

    return NextResponse.json(
      { message: "Sign Up Sucessfully!" },
      {
        status: 202,
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { message: "error, try again!" },
      {
        status: 404,
      }
    );
  }
}
