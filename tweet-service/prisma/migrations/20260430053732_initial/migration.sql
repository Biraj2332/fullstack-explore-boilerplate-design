-- CreateTable
CREATE TABLE "tweets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" VARCHAR(280) NOT NULL,
    "mediaUrls" JSONB NOT NULL DEFAULT '[]',
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "retweetsCount" INTEGER NOT NULL DEFAULT 0,
    "originalTweetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tweets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "likes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tweetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "serviceName" TEXT NOT NULL,
    "commandName" TEXT,
    "queryName" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "oldData" JSONB,
    "newData" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tweets_userId_idx" ON "tweets"("userId");

-- CreateIndex
CREATE INDEX "tweets_createdAt_idx" ON "tweets"("createdAt");

-- CreateIndex
CREATE INDEX "tweets_userId_createdAt_idx" ON "tweets"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "likes_tweetId_idx" ON "likes"("tweetId");

-- CreateIndex
CREATE UNIQUE INDEX "likes_userId_tweetId_key" ON "likes"("userId", "tweetId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "tweets" ADD CONSTRAINT "tweets_originalTweetId_fkey" FOREIGN KEY ("originalTweetId") REFERENCES "tweets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_tweetId_fkey" FOREIGN KEY ("tweetId") REFERENCES "tweets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
