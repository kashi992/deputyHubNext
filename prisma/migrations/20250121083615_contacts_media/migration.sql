-- CreateTable
CREATE TABLE "ContactMedia" (
    "id" UUID NOT NULL,
    "contactId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileType" VARCHAR(128) NOT NULL,
    "fileUrl" VARCHAR(2048) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PK_ContactMedia" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IX_ContactMedia_contactId" ON "ContactMedia"("contactId");

-- CreateIndex
CREATE INDEX "IX_ContactMedia_userId" ON "ContactMedia"("userId");

-- AddForeignKey
ALTER TABLE "ContactMedia" ADD CONSTRAINT "ContactMedia_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactMedia" ADD CONSTRAINT "ContactMedia_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
