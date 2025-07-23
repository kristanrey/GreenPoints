import { 
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent, 
  IonHeader, 
  IonMenuButton, 
  IonPage, 
  IonTitle, 
  IonToolbar 
} from '@ionic/react';

const newsData = [
  {
    id: "1",
    title: "Stars align, surprises unfold as ‘Pinoy Big Brother: Celebrity Collab Edition’ begins",
    subtitle: "ABC-CBN network",
    image: "https://od2-image-api.abs-cbn.com/prod/editorImage/1741590849983Thumb-Photos%20(1).jpg",
    link: "https://www.abs-cbn.com/entertainment/studios/tv/2025/3/10/stars-align-surprises-unfold-as-pinoy-big-brother-celebrity-collab-edition-begins-1518"
  },
  {
    id: "2",
    title: "Paul Mercado is new DICT officer-in-charge after Ivan Uy’s exit: PCO",
    subtitle: "ABC-CBN networks",
    image: "https://od2-image-api.abs-cbn.com/prod/20250310120336/31f02bb1231fab61c99f3b7a00fe44c3eec9a7915ac8ef5cf6a1d28a807fdc92.jpg?w=306&h=204",
    link: "https://www.abs-cbn.com/news/nation/2025/3/10/paul-mercado-is-new-dict-officer-in-charge-after-ivan-uy-s-exit-pco-2041"
  },
  {
    id: "3",
    title: "Halalan 2025: Key dates, facts on Philippines' midterm elections",
    subtitle: "ABS-CBN News",
    image: "https://od2-image-api.abs-cbn.com/prod/editorImage/173640969116320231030-bske-mall-voting-manila-MD2.jpg",
    link: "https://www.abs-cbn.com/news/nation/2025/1/9/halalan-2025-key-dates-facts-on-philippines-midterm-elections-1611"
  }
];

const Feed: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot='start'>
            <IonMenuButton></IonMenuButton>
          </IonButtons>
          <IonTitle>News Feed</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        {newsData.map((news) => (
          <IonCard key={news.id}>
            <IonCardHeader>
              <IonCardTitle>
                <a 
                  href={news.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ textDecoration: 'none', color: 'blue' }}
                >
                  {news.title}
                </a>
              </IonCardTitle>
              <IonCardSubtitle>{news.subtitle}</IonCardSubtitle>
            </IonCardHeader>
            <IonCardContent>
              <img src={news.image} alt={news.title} style={{ width: "100%", borderRadius: "10px" }} />
            </IonCardContent>
          </IonCard>
        ))}
      </IonContent>
    </IonPage>
  );
};

export default Feed;