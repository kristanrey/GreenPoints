// src/pages/NewsDetail.tsx
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonImg,
  IonSpinner,
} from "@ionic/react";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";

interface RouteParams {
  id: string;
}

const NewsDetail: React.FC = () => {
  const { id } = useParams<RouteParams>();
  const [news, setNews] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      const { data, error } = await supabase
        .from("news")
        .select("id, title, content, image_url, created_at")
        .eq("id", id)
        .single();

      if (!error && data) {
        setNews(data);
      }
      setLoading(false);
    };

    fetchNews();
  }, [id]);

  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-text-center ion-padding">
          <IonSpinner name="crescent" />
          <p>Loading news...</p>
        </IonContent>
      </IonPage>
    );
  }

  if (!news) {
    return (
      <IonPage>
        <IonContent className="ion-text-center ion-padding">
          <p>News not found.</p>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/GreenPoints/dashboard" />
          </IonButtons>
          <IonTitle>News Detail</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonCard>
          {news.image_url && <IonImg src={news.image_url} alt={news.title} />}
          <IonCardHeader>
            <IonCardTitle>{news.title}</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>{news.content}</p>
            <small>📅 {new Date(news.created_at).toLocaleDateString()}</small>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default NewsDetail;
