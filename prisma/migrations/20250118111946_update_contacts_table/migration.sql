-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "companyRegistrationNumber" TEXT,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "phone1" TEXT,
ADD COLUMN     "phone2" TEXT,
ADD COLUMN     "salutation" TEXT,
ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "stage" DROP NOT NULL;
