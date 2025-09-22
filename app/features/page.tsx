"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Button from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export default function FeaturesPage() {
  const { t } = useTranslation();
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">{t("features")}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("govt_schemes")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>{t("govt_schemes_desc")}</p>
            <Button asChild className="bg-green-600 hover:bg-green-700"><a href="/schemes">{t("open")}</a></Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("voice_assistant")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>{t("voice_assistant_desc")}</p>
            <Button asChild className="bg-green-600 hover:bg-green-700"><a href="/voice">{t("open")}</a></Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("ai_chatbot")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>{t("ai_chatbot_desc")}</p>
            <Button asChild className="bg-green-600 hover:bg-green-700"><a href="/chatbot">{t("open")}</a></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


