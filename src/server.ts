import dotenv from "dotenv";
dotenv.config({ path: './jikjikjik-Web-Env/.env' });
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import { z } from "zod";
import { ZodTypeProvider, serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import path from "node:path";

const app = Fastify({
  logger: { transport: { target: "pino-pretty" } }
}).withTypeProvider<ZodTypeProvider>();

// Zod 스키마를 런타임 검증/직렬화에 쓰도록 연결
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// 보안/기본 플러그인
await app.register(helmet);
await app.register(cors, { origin: true, credentials: true });
await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });

// 정적 파일 서빙: public 디렉토리
await app.register(fastifyStatic, {
  root: path.join(process.cwd(), "public"),
  prefix: "/",                 // http://localhost:3000/ 로 접근
  index: ["index.html"]        // 루트 접근 시 index.html
});

// API 라우트(예시)
// 헬스체크
app.get("/healthz", async () => ({ ok: true }));
app.get("/readyz", async () => ({ ready: true }));

// 에코 엔드포인트 (Zod 검증 예시)
app.post("/api/echo", {
  schema: {
    body: z.object({
      message: z.string().min(1),
      count: z.number().int().min(1).max(10).default(1)
    }),
    response: { 200: z.object({ repeated: z.array(z.string()) }) }
  }
}, async (req) => {
  const { message, count } = req.body;
  return { repeated: Array.from({ length: count }, () => message) };
});

// 서버 시간(무상태)
app.get("/api/time", {
  schema: { response: { 200: z.object({ now: z.string() }) } }
}, async () => ({ now: new Date().toISOString() }));

// SPA(리액트/바닐라) 지원용 선택: /api/* 외 모든 GET을 index.html로
// 필요할 때 주석 해제
// app.get("/*", (_, reply) => reply.sendFile("index.html"));

const port = Number(process.env.PORT) || 3000;
app.listen({ port, host: "0.0.0.0" }).then(() => {
  app.log.info(`Server listening on :${port}`);
});
