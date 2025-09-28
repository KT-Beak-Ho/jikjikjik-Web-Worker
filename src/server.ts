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
})//.withTypeProvider<ZodTypeProvider>();

// Zod 스키마를 런타임 검증/직렬화에 쓰도록 연결
// app.setValidatorCompiler(validatorCompiler);
// app.setSerializerCompiler(serializerCompiler);

// 보안/기본 플러그인
await app.register(helmet, {contentSecurityPolicy: false });
await app.register(cors, { origin: true, credentials: true });
await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });


// 정적 파일 서빙: public 디렉토리
await app.register(fastifyStatic, {
  root: path.join(process.cwd(), "public"),
  prefix: "/",                 // http://localhost:3000/ 로 접근
  index: ["index.html"]        // 루트 접근 시 index.html
});

// 클라이언트용 환경변수 API
app.get('/api/config', async (request, reply) => {
  console.log('클라이언트 환경변수 요청');
  console.log('현재 API_BASE_URL:', process.env.API_BASE_URL);
  
  const config = {
    API_BASE_URL: process.env.API_BASE_URL,
    // 다른 클라이언트에서 필요한 환경변수들도 여기에 추가 가능
    // NODE_ENV: process.env.NODE_ENV
  };
  
  reply.header('Content-Type', 'application/json');
  return config;
});

// 루트 경로에서 index.html 서빙
app.get('/', async (request, reply) => {
  return reply.sendFile('index.html');
});


// API 라우트(예시)
// 헬스체크
app.get("/healthz", async () => ({ ok: true }));
app.get("/readyz", async () => ({ ready: true }));


// 인증 관련 라우트 등록
// await app.register(import('./company/auth.ts'), { prefix: '/api/company' });
// await app.register(import('./company/login.ts'), { prefix: '/api/company' });



const port = Number(process.env.PORT) || 3000;


const start = async () => {
  try {
    await app.listen({ port, host: "0.0.0.0" });
    console.log('서버가 http://localhost:'+port+' 에서 실행 중입니다.');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();