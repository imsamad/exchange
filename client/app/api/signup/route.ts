import { pgPool } from "@/app/pg";
import * as bcrypt from "bcrypt";
import { NextResponse } from "next/server";

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

    await pgPool.query(
      `INSERT INTO "balances" (user_id, asset, available, locked) VALUES ($1, $2, $3, $4)  RETURNING *`,
      [res.rows[0].user_id, "inr", 10000, 0]
    );

    const repo = await fetch(`${process.env.API_URL}/onramp`, {
      method: "post",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        userId: res.rows[0].user_id,
        amount: 10000,
        txnId: "",
        quoteAsset: "inr",
      }),
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
