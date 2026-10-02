
-- CreateTable
CREATE TABLE "TrafficDay" (
    "day" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "visitors" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TrafficDay_pkey" PRIMARY KEY ("day")
);

-- CreateTable
CREATE TABLE "TrafficPage" (
    "day" DATE NOT NULL,
    "path" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TrafficPage_pkey" PRIMARY KEY ("day","path")
);

-- CreateTable
CREATE TABLE "TrafficSource" (
    "day" DATE NOT NULL,
    "source" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TrafficSource_pkey" PRIMARY KEY ("day","source")
);

-- CreateTable
CREATE TABLE "TrafficVisitor" (
    "day" DATE NOT NULL,
    "hash" TEXT NOT NULL,

    CONSTRAINT "TrafficVisitor_pkey" PRIMARY KEY ("day","hash")
);

