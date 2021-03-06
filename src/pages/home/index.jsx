import React, { useEffect } from 'react';
import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import moment from 'moment';

import Footer from 'components/footer';
import { Avatar } from "baseui/avatar";
import HeaderBar from 'components/headerBar';
import s from './styles.module.scss';

const GET_POSTS = gql`
  query Posts {
    posts {
      _id
      title
      cover
      date
      pinned
      author {
        _id
        name
        avatar
      }
    }
  }
`

const Home = ({ history, match }) => {
  const { data, refetch } = useQuery(GET_POSTS, {
    onError({ message }) {
      console.log('home page: ', message)
    }
  });

  useEffect(() => {
    document.title = 'Feed | console.blog';
    if (data) refetch();
  }, [])

  return (
    <>
      <HeaderBar match={match} />
      <div className={s.container}>
        <div className={s.postsGrid}>
          {data && [...data.posts].sort((a) => a.pinned ? -1 : 1).map(item => {
            return (
              <div 
                className={s.card} 
                onClick={() => history.push(`/post/${item._id}`)}
                style={{
                  background: `linear-gradient(0deg, rgba(41,41,41,0.9) 0%, rgba(41,41,41,0) 51%), 
                  ${item.cover ? `url(${item.cover}) center no-repeat` : 'rgb(41, 41, 41)'}`,
                  backgroundSize: 'cover',
                }}
                key={item._id}
              >
                <div className={s.top}>
                  <div className={s.date}>{moment(item.date, 'x').format("DD-MM-YYYY")}</div>
                  {item.pinned &&
                    <div className={s.pinned}>🔥</div>
                  }
                </div>
                <div className={s.bottom}>
                  <h4>{item.title}</h4>
                  <div className={s.author}>
                    <Avatar size={'20px'} name={item.author.name} src={item.author.avatar} />
                    <div className={s.name}>{item.author.name}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <Footer />
    </>
  )
}

export default Home;
